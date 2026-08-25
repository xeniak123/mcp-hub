import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Plug, RotateCw, Search, Square } from 'lucide-react';
import type { ConnectorInstance } from '@hub/shared';
import { api } from '../lib/api';
import { Button, Card, ConfirmDialog, EmptyState, Input, StatusBadge, cx } from '../components/ui/primitives';
import { useToast } from '../components/ui/toast';

const statusOrder: Record<string, number> = { running: 0, starting: 1, error: 2, stopped: 3 };

export function DashboardPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const connectors = useQuery({ queryKey: ['connectors'], queryFn: api.connectors });
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  const [search, setSearch] = useState('');
  const [bulk, setBulk] = useState<'restart' | 'stop' | null>(null);

  const restart = useMutation({
    mutationFn: (id: string) => api.restart(id),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => toast.error((e as Error).message),
  });

  const restartAll = useMutation({
    mutationFn: () => api.restartAll(),
    onSuccess: (r) => {
      void qc.invalidateQueries();
      toast.success(`Restarted ${r.restarted} connector${r.restarted === 1 ? '' : 's'}${r.failed ? ` · ${r.failed} failed` : ''}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const stopAll = useMutation({
    mutationFn: () => api.stopAll(),
    onSuccess: (r) => {
      void qc.invalidateQueries();
      toast.success(`Stopped ${r.stopped} connector${r.stopped === 1 ? '' : 's'}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const list = connectors.data?.connectors ?? [];
  const sorted = useMemo(
    () =>
      [...list]
        .filter((c) => {
          const q = search.trim().toLowerCase();
          return !q || c.displayName.toLowerCase().includes(q) || c.registryId.toLowerCase().includes(q);
        })
        .sort(
          (a, b) =>
            statusOrder[a.status] - statusOrder[b.status] || a.displayName.localeCompare(b.displayName)
        ),
    [list, search]
  );
  const enabledCount = list.filter((c) => c.enabled).length;

  return (
    <div className="animate-rise space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Overview</p>
          <h1 className="mt-1 text-xl font-medium tracking-tight text-ink">Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="subtle"
            className="gap-1.5 !px-3 !py-1.5 text-xs"
            onClick={() => setBulk('stop')}
            disabled={enabledCount === 0}
          >
            <Square className="h-3.5 w-3.5" strokeWidth={1.75} /> Stop all
          </Button>
          <Button
            variant="subtle"
            className="gap-1.5 !px-3 !py-1.5 text-xs"
            onClick={() => setBulk('restart')}
            disabled={enabledCount === 0}
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} /> Restart all
          </Button>
          <Link to="/marketplace">
            <Button variant="subtle" className="gap-2">
              <Plug className="h-4 w-4" strokeWidth={1.75} /> Add connector
            </Button>
          </Link>
        </div>
      </header>

      {/* Stat row — quiet numbers, no tiles */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-line pb-7 lg:grid-cols-4">
        <Stat label="Installed" value={stats.data?.installed ?? 0} />
        <Stat label="Running" value={stats.data?.running ?? 0} tone="ok" />
        <Stat
          label="Errors"
          value={stats.data?.errors ?? 0}
          tone={stats.data?.errors ? 'bad' : undefined}
        />
        <Stat label="Enabled" value={stats.data?.enabled ?? 0} />
      </dl>

      {/* Fleet */}
      <div className="space-y-4">
        {list.length > 3 && (
          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              strokeWidth={1.75}
            />
            <Input
              id="dashboard-search"
              placeholder="Search installed connectors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-9"
            />
          </div>
        )}

        {connectors.isLoading ? (
          <p className="py-16 text-center font-mono text-xs text-ink-faint">loading connectors…</p>
        ) : sorted.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Plug className="h-5 w-5" />}
              title={search ? 'Nothing matches your search' : 'No connectors installed'}
              hint={
                search
                  ? 'Try a shorter or different term.'
                  : 'Browse the marketplace and install your first connector with one click.'
              }
              action={
                search ? undefined : (
                  <Link to="/marketplace">
                    <Button>Open Marketplace</Button>
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <div key={search} className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((c) => (
              <ConnectorCard
                key={c.id}
                c={c}
                onRestart={() => restart.mutate(c.id)}
                restarting={restart.isPending && restart.variables === c.id}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={bulk !== null}
        title={bulk === 'restart' ? 'Restart all connectors?' : 'Stop all connectors?'}
        message={
          bulk === 'restart'
            ? `Every enabled connector (${enabledCount}) will be restarted. Tools are briefly unavailable.`
            : `Every enabled connector (${enabledCount}) will be stopped and disabled. Re-enable them individually afterwards.`
        }
        confirmLabel={bulk === 'restart' ? 'Restart all' : 'Stop all'}
        busy={restartAll.isPending || stopAll.isPending}
        error={((bulk === 'restart' ? restartAll.error : stopAll.error) as Error | null)?.message}
        onConfirm={() => {
          if (bulk === 'restart') restartAll.mutate();
          else stopAll.mutate();
          setBulk(null);
        }}
        onClose={() => setBulk(null)}
      />
    </div>
  );
}

function ConnectorCard({
  c,
  onRestart,
  restarting,
}: {
  c: ConnectorInstance;
  onRestart: () => void;
  restarting: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4 !p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/connectors/${c.id}`} className="group min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink underline-offset-4 group-hover:underline">
            {c.displayName}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{c.registryId}</p>
        </Link>
        <StatusBadge status={c.status} />
      </div>

      {c.statusDetail && (
        <p className="rounded-lg bg-black/20 px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-dim">
          {c.statusDetail}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          restarts&nbsp;{String(c.restartCount).padStart(2, '0')}
        </span>
        <Button variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={onRestart} disabled={restarting}>
          <RotateCw className={cx('h-3.5 w-3.5', restarting && 'animate-spin')} />
          Restart
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'bad' }) {
  return (
    <div>
      <dd
        className={cx(
          'text-3xl font-medium tracking-tight tabular-nums',
          tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : 'text-ink'
        )}
      >
        {value}
      </dd>
      <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</dt>
    </div>
  );
}
