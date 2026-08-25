import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpCircle,
  Download,
  KeyRound,
  Laptop,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, CopyButton, EmptyState, Input, Modal } from '../components/ui/primitives';
import { useToast } from '../components/ui/toast';

export function SettingsPage() {
  const keysQ = useQuery({ queryKey: ['keys'], queryFn: api.keys });
  const metaQ = useQuery({ queryKey: ['meta'], queryFn: api.meta, staleTime: Infinity });

  return (
    <div className="animate-rise space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Hub</p>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-dim">API access, account security and client setup.</p>
      </header>

      <AccountSecurityCard />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">API Keys</h2>
          <NewKeyButton />
        </div>
        {keysQ.data?.keys.length ? (
          <div className="stagger space-y-2">
            {keysQ.data.keys.map((k) => (
              <ApiKeyRow key={k.id} k={k} />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<KeyRound className="h-5 w-5" />}
              title="No API keys yet"
              hint="Create a key so external AI clients can call your MCP endpoint."
            />
          </Card>
        )}
      </section>

      <ClientSetupCard />

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Backup &amp; restore</h2>
        <BackupRestoreCard />
      </section>

      <UpdatesCard />

      <footer className="border-t border-line pt-4 font-mono text-[10px] uppercase tracking-wider text-ink-faint/70">
        mcp-hub {metaQ.data ? `v${metaQ.data.version} · build ${metaQ.data.commit.slice(0, 7)}` : ''}
      </footer>
    </div>
  );
}

function AccountSecurityCard() {
  const toast = useToast();
  const qc = useQueryClient();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const sessionsQ = useQuery({ queryKey: ['sessions'], queryFn: api.sessions });

  const change = useMutation({
    mutationFn: () => api.changePassword(current, next),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      void qc.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Password changed · other devices signed out');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const revokeSession = useMutation({
    mutationFn: (id: string) => api.revokeSession(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] }),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate();
        }}
        className="space-y-3"
      >
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
          <ShieldCheck className="h-4 w-4 text-ink-dim" /> Change password
        </h2>
        <p className="max-w-xl text-xs leading-relaxed text-ink-dim">
          Changing your password signs out every other device immediately.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={!current || next.length < 8 || change.isPending}>
          Update password
        </Button>
      </form>

      <div className="space-y-3 border-t border-line pt-5">
        <h2 className="text-sm font-medium text-ink">Active sessions</h2>
        {sessionsQ.data?.sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 rounded-lg border border-line px-3 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-medium text-ink">
                <Laptop className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                {s.ip ?? 'unknown IP'}
                {s.current && (
                  <span className="rounded border border-ok/30 px-1.5 font-mono text-[9px] uppercase tracking-wider text-ok">
                    this device
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-ink-faint">
                {s.userAgent ?? 'unknown browser'} · since {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!s.current && (
              <Button
                variant="danger"
                className="!px-2.5 !py-1 text-xs"
                onClick={() => revokeSession.mutate(s.id)}
                disabled={revokeSession.isPending}
              >
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Update check + one-click upgrade path. The hub container can't replace its
 * own image, so the "one click" produces the exact command for the deployment
 * (docker compose or Portainer pull) and Watchtower users see that updates
 * happen on their own.
 */
function UpdatesCard() {
  const toast = useToast();
  const qc = useQueryClient();
  const check = useQuery({
    queryKey: ['update-check'],
    queryFn: () => api.updateCheck(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const recheck = useMutation({
    mutationFn: () => api.updateCheck(true),
    onSuccess: (r) => {
      qc.setQueryData(['update-check'], r);
      toast.success(r.updateAvailable ? 'New version found' : 'You are up to date');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (check.isLoading) return null;
  const d = check.data;
  if (!d) return null;

  const composeCmd =
    'docker compose pull app && docker compose up -d --no-deps --force-recreate app';
  const portainerHint =
    'Portainer: Stack → your stack → Pull and redeploy';

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Updates</h2>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <ArrowUpCircle
                className={d.updateAvailable ? 'h-4 w-4 text-ok' : 'h-4 w-4 text-ink-faint'}
                strokeWidth={1.75}
              />
              {d.latestVersion === null
                ? 'Could not check for updates'
                : d.updateAvailable
                  ? `v${d.currentVersion} → v${d.latestVersion} available`
                  : `Up to date · v${d.currentVersion}`}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              checked {new Date(d.checkedAt).toLocaleString()} · hub.docker.com / github releases
            </p>
          </div>
          <Button variant="subtle" onClick={() => recheck.mutate()} disabled={recheck.isPending}>
            {recheck.isPending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Check now
          </Button>
        </div>

        {d.updateAvailable && (
          <div className="space-y-3 rounded-lg border border-ok/30 bg-ok/5 p-4">
            <p className="text-xs leading-relaxed text-ink-dim">
              A new version is available{d.publishedAt && ` (published ${new Date(d.publishedAt).toLocaleDateString()})`}.
              The hub can't rebuild its own container — run this on the host:
            </p>
            <code className="block break-all rounded-lg bg-black/40 p-3 font-mono text-[11px] text-ok">
              {composeCmd}
            </code>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={composeCmd} label="Copy command" />
              {d.releaseUrl && (
                <a
                  href={d.releaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  Release notes
                </a>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-ink-faint">
              {portainerHint}. Prefer zero-touch? Enable automatic updates with{' '}
              <code className="font-mono">docker compose --profile autoupdate up -d</code> — a
              Watchtower sidecar pulls new images hourly.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}

function ClientSetupCard() {
  const [origin] = useState(() => window.location.origin);
  const snippet = JSON.stringify(
    {
      mcpServers: {
        hub: {
          url: `${origin}/mcp`,
          headers: { Authorization: 'Bearer <YOUR_API_KEY>' },
        },
      },
    },
    null,
    2
  );
  return (
    <Card>
      <h2 className="text-sm font-medium text-ink">Connect an AI client</h2>
      <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-ink-dim">
        Point Claude Desktop, Cursor or any MCP client at the unified endpoint. Create an API key below and paste it in place of{' '}
        <code className="rounded bg-black/30 px-1 font-mono">&lt;YOUR_API_KEY&gt;</code>.
      </p>
      <pre className="well mt-4 overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-ink-dim">{snippet}</pre>
      <div className="mt-3 flex justify-end">
        <CopyButton text={snippet} label="Copy JSON" />
      </div>
    </Card>
  );
}

function BackupRestoreCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const qc = useQueryClient();

  const restore = useMutation({
    mutationFn: (data: unknown) => api.restoreBackup(data),
    onSuccess: (r) => {
      setResult(`Restored ${r.installed} connector${r.installed === 1 ? '' : 's'}${r.skipped ? ` · ${r.skipped} skipped` : ''}`);
      void qc.invalidateQueries();
    },
  });

  const pickFile = () => fileRef.current?.click();

  const onFile = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      restore.mutate(parsed);
    } catch {
      restore.reset();
      setResult('That file is not valid JSON.');
    }
  };

  return (
    <Card>
      <p className="max-w-xl text-xs leading-relaxed text-ink-dim">
        Export downloads every installed connector with its configuration — including decrypted secrets — as a single
        JSON file. Keep it somewhere safe. Import restores it on a fresh hub; already-installed connectors are skipped.
        API keys are not part of a backup.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href="/api/backup"
          download
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} /> Export
        </a>
        <Button variant="subtle" onClick={pickFile} disabled={restore.isPending}>
          {restore.isPending ? 'Restoring…' : (<><Upload className="h-4 w-4" strokeWidth={1.75} /> Import</>)}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
        {result && <span className="animate-fade font-mono text-[11px] uppercase tracking-wider text-ok">{result}</span>}
        {restore.isError && (
          <span className="animate-fade text-xs text-bad">{(restore.error as Error).message}</span>
        )}
      </div>
    </Card>
  );
}

function ApiKeyRow({
  k,
}: {
  k: { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string };
}) {
  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => api.revokeKey(k.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['keys'] }),
  });
  return (
    <Card className="flex items-center justify-between gap-4 !p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{k.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{k.keyPrefix}…</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint/70">
          {k.revokedAt
            ? 'revoked'
            : k.lastUsedAt
              ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
              : 'never used'}
        </p>
      </div>
      {!k.revokedAt && (
        <Button variant="danger" className="!px-2.5" onClick={() => revoke.mutate()} disabled={revoke.isPending}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Button>
      )}
    </Card>
  );
}

function NewKeyButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => api.createKey(name || 'default'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['keys'] }),
  });

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5 !px-3 !py-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> New key
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={create.data ? 'Your new API key' : 'Create API key'}>
        {create.data ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-dim">Copy this token now — it will not be shown again.</p>
            <code className="block break-all rounded-lg bg-black/40 p-4 font-mono text-xs text-ok">{create.data.token}</code>
            <div className="flex justify-end gap-2">
              <CopyButton text={create.data.token} label="Copy token" />
              <Button
                onClick={() => {
                  setOpen(false);
                  create.reset();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-4"
          >
            <Input placeholder="Key name (e.g. claude-desktop)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            {create.isError && <p className="text-xs text-bad">{(create.error as Error).message}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

