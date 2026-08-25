import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { ConnectorManifest, MarketplaceEntry } from '@hub/shared';
import { CATEGORIES } from '@hub/shared';
import * as icons from 'lucide-react';
import { api } from '../lib/api';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Textarea,
  Spinner,
  cx,
  inputCls,
} from '../components/ui/primitives';
import { useToast } from '../components/ui/toast';

type SortMode = 'official' | 'popular' | 'name';

const sortLabels: Record<SortMode, string> = {
  official: 'Official first',
  popular: 'Most installed',
  name: 'Name A–Z',
};

export function MarketplacePage() {
  const marketplace = useQuery({ queryKey: ['marketplace'], queryFn: api.marketplace });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('official');
  const [installing, setInstalling] = useState<MarketplaceEntry | null>(null);

  const entries = marketplace.data?.entries ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = entries.filter((e) => {
      const matchesSearch =
        !q ||
        e.manifest.name.toLowerCase().includes(q) ||
        e.manifest.description.toLowerCase().includes(q) ||
        (e.manifest.keywords ?? []).some((k) => k.includes(q));
      const matchesCategory = !category || e.manifest.category === category;
      return matchesSearch && matchesCategory;
    });
    result.sort((a, b) => {
      if (sort === 'name') return a.manifest.name.localeCompare(b.manifest.name);
      if (sort === 'popular') return b.installedCount - a.installedCount || a.manifest.name.localeCompare(b.manifest.name);
      return (
        Number(b.manifest.official ?? false) - Number(a.manifest.official ?? false) ||
        a.manifest.name.localeCompare(b.manifest.name)
      );
    });
    return result;
  }, [entries, search, category, sort]);

  return (
    <div className="animate-rise space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Catalog</p>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-ink">Marketplace</h1>
        <p className="mt-1 text-sm text-ink-dim">
          One-click install for MCP connectors. Configure once — available to every AI client.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            strokeWidth={1.75}
          />
          <Input
            placeholder="Search connectors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryChip label="All" active={!category} onClick={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.label}
              active={category === c.id}
              onClick={() => setCategory(category === c.id ? null : c.id)}
            />
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label="Sort connectors"
            className="ml-auto appearance-none rounded-md border border-line bg-transparent px-3 py-1 font-mono text-[11px] text-ink-dim transition-colors hover:border-line-strong hover:text-ink focus:outline-none"
          >
            {(Object.keys(sortLabels) as SortMode[]).map((m) => (
              <option key={m} value={m} className="bg-panel">
                {sortLabels[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {marketplace.isLoading ? (
        <p className="py-16 text-center font-mono text-xs text-ink-faint">loading catalog…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<icons.Store className="h-5 w-5" />} title="Nothing found" hint="Try a different search or category." />
        </Card>
      ) : (
        <div key={search + String(category) + sort} className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <MarketplaceCard key={entry.manifest.id} entry={entry} onInstall={() => setInstalling(entry)} />
          ))}
        </div>
      )}

      {installing && <InstallWizard entry={installing} onClose={() => setInstalling(null)} />}

      <CommunityRepos />
    </div>
  );
}

/**
 * Manage community connector repos: add a GitHub repo by URL, see what's
 * cached from it, remove it. New manifests appear after a hub restart
 * (the registry is merged at boot).
 */
function CommunityRepos() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [repoInput, setRepoInput] = useState('');

  const repos = useQuery({ queryKey: ['community-repos'], queryFn: api.communityRepos });

  const add = useMutation({
    mutationFn: () => api.addCommunityRepo(repoInput.trim()),
    onSuccess: (r) => {
      setRepoInput('');
      void qc.invalidateQueries({ queryKey: ['community-repos'] });
      void qc.invalidateQueries({ queryKey: ['marketplace'] });
      toast.success(
        `Added ${r.added} connector${r.added === 1 ? '' : 's'}` +
          (r.skipped > 0 ? ` · ${r.skipped} skipped` : '') +
          ' — restart the hub to see them in the catalog'
      );
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const remove = useMutation({
    mutationFn: (repo: string) => api.removeCommunityRepo(repo),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['community-repos'] });
      void qc.invalidateQueries({ queryKey: ['marketplace'] });
      toast.success('Repo removed — restart the hub to drop its connectors');
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const list = repos.data?.repos ?? [];

  return (
    <section className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
      >
        <icons.Github className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
        <span className="text-sm font-medium text-ink">Community repos</span>
        {list.length > 0 && (
          <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-ink-faint">
            {list.length}
          </span>
        )}
        <icons.ChevronDown
          className={cx('ml-auto h-4 w-4 text-ink-faint transition-transform duration-200', open && 'rotate-180')}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <Card className="mt-4 animate-rise space-y-4 !p-5">
          <p className="text-sm leading-relaxed text-ink-dim">
            Point the hub at a public GitHub repo of connector manifests — an{' '}
            <code className="font-mono text-xs text-ink">index.json</code> listing file paths, or
            plain <code className="font-mono text-xs text-ink">*.json</code> manifests at the repo
            root. They're fetched, validated and merged into this catalog.
          </p>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (repoInput.trim()) add.mutate();
            }}
          >
            <Input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
            />
            <Button type="submit" disabled={add.isPending || !repoInput.trim()} className="shrink-0">
              {add.isPending && <Spinner />} Add repo
            </Button>
          </form>

          {repos.isLoading ? (
            <p className="font-mono text-xs text-ink-faint">loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-ink-faint">
              No community repos yet. Try e.g.{' '}
              <span className="font-mono text-xs">mcp-hub/connectors-community</span>.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((r) => (
                <li key={r.repo} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-ink">{r.repo}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                      {r.connectors} connector{r.connectors === 1 ? '' : 's'} · added{' '}
                      {new Date(r.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="!px-2.5 !py-1 text-xs text-bad hover:!border-bad/40"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove ${r.repo} and its connectors from the catalog?`)) {
                        remove.mutate(r.repo);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-ink-faint">
            Manifest changes take effect on the next hub restart — the catalog registry is built at
            boot.
          </p>
        </Card>
      )}
    </section>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md border px-3 py-1 font-mono text-[11px] transition-colors duration-150 ' +
        (active
          ? 'border-ink/40 bg-white/10 text-ink'
          : 'border-line text-ink-faint hover:border-line-strong hover:text-ink-dim')
      }
    >
      {label}
    </button>
  );
}

function ManifestIcon({ name }: { name: string }) {
  const Icon = (icons as unknown as Record<string, icons.LucideIcon>)[name] ?? icons.Puzzle;
  return <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />;
}

function MarketplaceCard({ entry, onInstall }: { entry: MarketplaceEntry; onInstall: () => void }) {
  const m = entry.manifest;
  return (
    <Card className="flex flex-col gap-3 !p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
            {m.name}
            {m.official && (
              <span
                title="Maintained in the mcp-hub registry"
                className="shrink-0 rounded border border-ok/30 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-ok"
              >
                official
              </span>
            )}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">{m.category}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-dim">
          <ManifestIcon name={m.icon} />
        </div>
      </div>
      <p className="line-clamp-2 min-h-8 text-sm leading-relaxed text-ink-dim">{m.description}</p>
      <div className="mt-auto flex items-center justify-between pt-1">
        {entry.installedCount > 0 ? (
          <span className="font-mono text-[11px] text-ok">
            installed{entry.installedCount > 1 ? ` ×${entry.installedCount}` : ''}
          </span>
        ) : (
          <span />
        )}
        <Button onClick={onInstall} className="!px-3 !py-1.5 text-xs" variant={entry.installedCount > 0 ? 'subtle' : 'primary'}>
          Install
        </Button>
      </div>
    </Card>
  );
}

/**
 * Install flow: create instance → fill schema-generated config form → enable.
 */
function InstallWizard({ entry, onClose }: { entry: MarketplaceEntry; onClose: () => void }) {
  const qc = useQueryClient();
  const m = entry.manifest;
  const [values, setValues] = useState<Record<string, string>>({});

  const install = useMutation({
    mutationFn: async () => {
      // create → save config → enable (spawns the child process)
      const { id } = await api.installConnector(m.id);
      if (Object.keys(m.configSchema.properties).length > 0) {
        await api.saveConfig(id, values);
      }
      await api.enable(id);
      return id;
    },
    onSuccess: () => void qc.invalidateQueries(),
  });

  const fields = Object.entries(
    m.configSchema.properties
  ) as Array<[string, ConnectorManifest['configSchema']['properties'][string]]>;
  const required = m.configSchema.required ?? [];

  return (
    <Modal open onClose={onClose} title={`Install ${m.name}`} wide>
      {install.isSuccess ? (
        <div className="animate-pop space-y-4 py-4 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ok/40 text-ok">
            <icons.Check className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{m.name} is running</p>
            <p className="mt-1 text-sm text-ink-dim">
              Its tools are now aggregated into your hub's MCP endpoint.
            </p>
          </div>
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            install.mutate();
          }}
          className="space-y-4"
        >
          <p className="text-sm leading-relaxed text-ink-dim">{m.description}</p>

          {fields.length > 0 ? (
            <div className="space-y-3.5">
              {fields.map(([key, field]) => (
                <label key={key} className="block space-y-1.5">
                  <span className="flex items-center gap-2 text-xs font-medium text-ink">
                    {field.title ?? key}
                    {required.includes(key) && <span className="text-bad">*</span>}
                  </span>
                  <ConfigInput
                    field={{ ...field, ui: field.ui }}
                    value={values[key] ?? ''}
                    onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                  />
                  {field.description && (
                    <span className="block text-[11px] text-ink-faint">{field.description}</span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint">This connector needs no configuration.</p>
          )}

          {install.isError && (
            <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
              {(install.error as Error).message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={install.isPending}>
              {install.isPending && <Spinner />}
              Install &amp; Enable
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ConfigInput({
  field,
  value,
  onChange,
}: {
  field: ConnectorManifest['configSchema']['properties'][string];
  value: string;
  onChange: (v: string) => void;
}) {
  const widget = field.ui?.widget;
  if (widget === 'textarea') {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.ui?.placeholder}
        rows={3}
      />
    );
  }
  if (field.enum) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, 'appearance-none')}
      >
        {(field.enum as string[]).map((opt) => (
          <option key={opt} value={opt} className="bg-panel">
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      type={widget === 'password' ? 'password' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.ui?.placeholder}
    />
  );
}

