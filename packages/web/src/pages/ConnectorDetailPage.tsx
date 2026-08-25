import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Pencil, Play, PlugZap, RotateCw, Save, Search, Trash2 } from 'lucide-react';
import type { ConnectorManifest } from '@hub/shared';
import * as icons from 'lucide-react';
import { api } from '../lib/api';
import { createHubSocket } from '../lib/ws';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  StatusBadge,
  Tabs,
  cx,
  inputCls,
} from '../components/ui/primitives';
import { useToast } from '../components/ui/toast';

const tabs = [
  { id: 'config', label: 'Configuration' },
  { id: 'tools', label: 'Tools' },
  { id: 'logs', label: 'Logs' },
];

export function ConnectorDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('config');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const connectors = useQuery({ queryKey: ['connectors'], queryFn: api.connectors });
  const connector = connectors.data?.connectors.find((c) => c.id === id);

  const enable = useMutation({
    mutationFn: () => api.enable(id),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => toast.error((e as Error).message),
  });
  const disable = useMutation({
    mutationFn: () => api.disable(id),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => toast.error((e as Error).message),
  });
  const restart = useMutation({
    mutationFn: () => api.restart(id),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => toast.error((e as Error).message),
  });
  const uninstall = useMutation({
    mutationFn: () => api.uninstall(id),
    onSuccess: () => {
      void qc.invalidateQueries();
      void navigate('/');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (connectors.isLoading) {
    return <p className="py-16 text-center font-mono text-xs text-ink-faint">loading…</p>;
  }
  if (!connector) {
    return (
      <Card>
        <EmptyState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connector not found"
          action={
            <Link to="/" className="text-sm text-ink-dim underline underline-offset-4">
              Back to dashboard
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-faint transition-colors hover:text-ink-dim"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-medium tracking-tight text-ink">
            {connector.displayName}
            <button
              type="button"
              aria-label="Rename connector"
              onClick={() => setRenaming(true)}
              className="rounded p-1 text-ink-faint opacity-60 transition-all hover:bg-white/5 hover:text-ink hover:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={connector.status} />
            {connector.statusDetail && (
              <span className="text-xs text-ink-faint">{connector.statusDetail}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connector.enabled ? (
            <>
              <Button variant="subtle" onClick={() => restart.mutate()} disabled={restart.isPending}>
                <RotateCw className={cx('h-4 w-4', restart.isPending && 'animate-spin')} strokeWidth={1.75} /> Restart
              </Button>
              <Button variant="danger" onClick={() => disable.mutate()} disabled={disable.isPending}>
                Disable
              </Button>
            </>
          ) : (
            <Button onClick={() => enable.mutate()} disabled={enable.isPending}>
              <Play className="h-4 w-4" strokeWidth={1.75} /> Enable
            </Button>
          )}
          <Button
            variant="danger"
            aria-label={`Uninstall ${connector.displayName}`}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
      </header>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'config' && <ConfigTab connectorId={id} registryId={connector.registryId} enabled={connector.enabled} />}
      {tab === 'tools' && <ToolsTab connectorId={id} running={connector.status === 'running'} />}
      {tab === 'logs' && <LogsTab connectorId={id} />}

      <ConfirmDialog
        open={confirmingDelete}
        title={`Uninstall ${connector.displayName}?`}
        message="The instance, its encrypted config and its logs will be permanently deleted."
        confirmLabel="Uninstall"
        busy={uninstall.isPending}
        error={(uninstall.error as Error | null)?.message}
        onConfirm={() => uninstall.mutate()}
        onClose={() => {
          setConfirmingDelete(false);
          uninstall.reset();
        }}
      />

      <RenameModal
        open={renaming}
        connectorId={id}
        currentName={connector.displayName}
        onClose={() => setRenaming(false)}
      />
    </div>
  );
}

function RenameModal({
  open,
  connectorId,
  currentName,
  onClose,
}: {
  open: boolean;
  connectorId: string;
  currentName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const rename = useMutation({
    mutationFn: () => api.renameConnector(connectorId, name.trim()),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success('Renamed');
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Rename connector">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) rename.mutate();
        }}
        className="space-y-4"
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={64} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || rename.isPending}>
            {rename.isPending && 'Saving…'} Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// --- Configuration tab ------------------------------------------------------

function ConfigTab({ connectorId, registryId }: { connectorId: string; registryId: string; enabled: boolean }) {
  const manifestQ = useQuery({ queryKey: ['marketplace'], queryFn: api.marketplace });
  const manifest: ConnectorManifest | undefined = manifestQ.data?.entries.find(
    (e) => e.manifest.id === registryId
  )?.manifest;

  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => api.saveConfig(connectorId, values),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (!manifest) return <p className="text-sm text-ink-faint">Loading schema…</p>;
  const fields = Object.entries(manifest.configSchema.properties);
  const required = manifest.configSchema.required ?? [];

  return (
    <Card className="max-w-xl animate-rise">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        {fields.length > 0 ? (
          fields.map(([key, field]) => (
            <label key={key} className="block space-y-1.5">
              <span className="flex items-center gap-2 text-xs font-medium text-ink">
                {field.title ?? key}
                {required.includes(key) && <span className="text-bad">*</span>}
              </span>
              <ConfigFieldInput
                field={field}
                value={values[key] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              />
              {field.description && (
                <span className="block text-[11px] leading-relaxed text-ink-faint">
                  {field.description}
                  {field.ui?.helpUrl && (
                    <>
                      {' '}
                      <a href={field.ui.helpUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-ink-dim">
                        Get one →
                      </a>
                    </>
                  )}
                </span>
              )}
            </label>
          ))
        ) : (
          <p className="text-sm text-ink-faint">This connector needs no configuration.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={save.isPending}>
            <Save className="h-4 w-4" strokeWidth={1.75} /> Save config
          </Button>
          {saved && (
            <span className="animate-fade font-mono text-[11px] uppercase tracking-wider text-ok">saved</span>
          )}
           {save.isError && <span className="text-xs text-bad">{(save.error as Error).message}</span>}
        </div>
      </form>
    </Card>
  );
}

// --- Tools tab --------------------------------------------------------------

function ToolsTab({ connectorId, running }: { connectorId: string; running: boolean }) {
  const toast = useToast();
  const toolsQ = useQuery({
    queryKey: ['connector-tools', connectorId],
    queryFn: () => api.connectorTools(connectorId),
    enabled: running,
    refetchInterval: 30_000,
  });

  if (!running) {
    return (
      <Card>
        <EmptyState
          icon={<PlugZap className="h-5 w-5" />}
          title="Connector is not running"
          hint="Enable the connector to preview its tools."
        />
      </Card>
    );
  }

  const tools = toolsQ.data?.tools ?? [];
  return (
    <div className="stagger space-y-3">
      {tools.length === 0 ? (
        <p className="py-8 text-center font-mono text-xs text-ink-faint">no tools discovered yet</p>
      ) : (
        tools.map((t) => (
          <Card key={t.name} className="!p-5">
            <button
              type="button"
              title="Click to copy the namespaced tool name"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(t.name);
                  toast.success(`Copied ${t.name}`);
                } catch {
                  toast.error('Clipboard unavailable');
                }
              }}
              className="group flex items-center gap-2 rounded font-mono text-sm font-medium text-ink transition-colors hover:text-white"
            >
              {t.name}
              <icons.Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
            </button>
            {t.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{t.description}</p>}
            {Object.keys((t.inputSchema as { properties?: object }).properties ?? {}).length > 0 && (
              <details className="group mt-3">
                <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-ink-faint transition-colors hover:text-ink-dim">
                  input schema
                </summary>
                <pre className="well mt-2 overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-ink-dim">
                  {JSON.stringify(t.inputSchema, null, 2)}
                </pre>
              </details>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

// --- Logs tab ---------------------------------------------------------------

const levelColor: Record<string, string> = {
  debug: 'text-ink-faint',
  info: 'text-ink-dim',
  warn: 'text-warn',
  error: 'text-bad',
  rpc: 'text-ink-faint opacity-70',
};

const ALL_LEVELS = ['debug', 'info', 'warn', 'error', 'rpc'] as const;

function LogsTab({ connectorId }: { connectorId: string }) {
  const toast = useToast();
  const history = useQuery({
    queryKey: ['logs', connectorId],
    queryFn: () => api.logs(connectorId),
  });
  const [live, setLive] = useState<Array<{ id: number; level: string; message: string; ts: string }>>([]);
  const [levels, setLevels] = useState<Set<string>>(new Set(ALL_LEVELS));
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.data) setLive(history.data.lines);
  }, [history.data]);

  useEffect(() => {
    const close = createHubSocket((event) => {
      if (event.type !== 'log' || event.connectorId !== connectorId) return;
      setLive((prev) => [...prev.slice(-1000), event.line]);
    });
    return close;
  }, [connectorId]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [live.length, autoScroll]);

  // Newest lines keep streaming in; filtering is view-only so nothing is lost.
  const visible = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return live.filter(
      (line) =>
        levels.has(line.level) &&
        (!q ||
          line.message.toLowerCase().includes(q) ||
          line.level.toLowerCase().includes(q))
    );
  }, [live, levels, filterText]);

  const download = () => {
    const text = live
      .map((l) => `${new Date(l.ts).toISOString()} [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${connectorId.slice(0, 8)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="!p-1.5">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {ALL_LEVELS.map((lvl) => {
          const on = levels.has(lvl);
          return (
            <button
              key={lvl}
              type="button"
              onClick={() =>
                setLevels((prev) => {
                  const next = new Set(prev);
                  if (next.has(lvl)) next.delete(lvl);
                  else next.add(lvl);
                  return next;
                })
              }
              className={cx(
                'rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors',
                on ? cx('border-line-strong', levelColor[lvl]) : 'border-line text-ink-faint/50'
              )}
            >
              {lvl}
            </button>
          );
        })}
        <div className="relative ml-auto min-w-[10rem] flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
            strokeWidth={1.75}
          />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter…"
            className={cx(inputCls, '!py-1.5 !pl-8 text-xs')}
          />
        </div>
        <label className="flex cursor-pointer select-none items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="accent-current"
          />
          follow
        </label>
        <Button variant="ghost" className="!px-2 !py-1.5" onClick={download} disabled={live.length === 0}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="well max-h-[60vh] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
        {visible.length === 0 ? (
          <p className="text-ink-faint">
            {live.length === 0 ? 'no log output yet' : 'no lines match the current filters'}
          </p>
        ) : (
          visible.map((line, i) => (
            <div key={`${line.id}-${i}`} className="log-line flex gap-3 py-px">
              <span className="w-11 shrink-0 text-ink-faint/60">{new Date(line.ts).toLocaleTimeString()}</span>
              <span className={`w-11 shrink-0 uppercase ${levelColor[line.level] ?? 'text-ink-dim'}`}>
                {line.level}
              </span>
              <span className={`whitespace-pre-wrap break-all ${levelColor[line.level] ?? 'text-ink-dim'}`}>
                {line.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}





function ConfigFieldInput({
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
      <textarea
        rows={3}
        value={value}
        placeholder={field.ui?.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }
  if (field.enum) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, 'appearance-none')}>
        <option value="" className="bg-panel">— choose —</option>
        {field.enum.map((opt) => (
          <option key={opt} value={opt} className="bg-panel">{opt}</option>
        ))}
      </select>
    );
  }
  return (
    <Input
      type={widget === 'password' ? 'password' : 'text'}
      value={value}
      placeholder={field.ui?.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
