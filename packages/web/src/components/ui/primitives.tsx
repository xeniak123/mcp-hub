import { clsx } from 'clsx';
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import type { ConnectorStatus } from '@hub/shared';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return clsx(parts);
}

// --- Status badge -----------------------------------------------------------

const statusStyles: Record<ConnectorStatus, { label: string; text: string; pulse?: boolean }> = {
  running: { label: 'Running', text: 'text-ok', pulse: true },
  starting: { label: 'Starting', text: 'text-warn', pulse: false },
  error: { label: 'Error', text: 'text-bad', pulse: false },
  stopped: { label: 'Stopped', text: 'text-ink-faint', pulse: false },
};

export function StatusBadge({ status }: { status: ConnectorStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider',
        s.text
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {s.pulse && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {s.label}
    </span>
  );
}

// --- Buttons ----------------------------------------------------------------

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    // White is the only "brand" accent in the whole UI.
    primary: 'bg-ink text-bg hover:bg-white active:scale-[0.98]',
    ghost:
      'text-ink-dim hover:text-ink hover:bg-white/5 border border-transparent hover:border-line',
    danger:
      'text-bad hover:bg-bad/10 border border-transparent hover:border-bad/30 active:scale-[0.98]',
    subtle: 'bg-transparent border border-line-strong text-ink-dim hover:text-ink hover:border-ink-faint',
  };
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-sans text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40',
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

// --- Card -------------------------------------------------------------------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('card p-6', className)}>{children}</div>;
}

// --- Inputs -----------------------------------------------------------------

export const inputCls =
  'w-full rounded-lg border border-line bg-black/20 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors duration-150 focus:border-ink-faint focus:bg-black/25 focus:outline-none';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, 'font-mono text-xs', props.className)} />;
}

// --- Modal ------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  // Render through a portal into <body>: an ancestor with a CSS transform
  // (e.g. the page's animate-rise) becomes the containing block for
  // position:fixed, which would center the modal inside that container
  // instead of the viewport.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-fade absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'animate-pop card relative max-h-[85vh] w-full overflow-y-auto p-6 shadow-2xl shadow-black/50',
          wide ? 'max-w-2xl' : 'max-w-md'
        )}
      >
        {title && (
          <h2 className="mb-5 font-mono text-[11px] uppercase tracking-wider text-ink-dim">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

// --- Tabs (sliding underline) ----------------------------------------------

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const el = refs.current.get(active);
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs.length]);

  return (
    <div className="relative border-b border-line">
      <div className="-mb-px flex gap-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              if (el) refs.current.set(t.id, el);
            }}
            type="button"
            onClick={() => onChange(t.id)}
            className={cx(
              'pb-2.5 pt-1 text-sm transition-colors duration-200',
              active === t.id ? 'font-medium text-ink' : 'text-ink-faint hover:text-ink-dim'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {bar && (
        <span
          className="absolute bottom-0 h-px bg-ink transition-all duration-300 ease-out"
          style={{ left: bar.left, width: bar.width }}
        />
      )}
    </div>
  );
}

// --- Spinner / Empty state ---------------------------------------------------

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-70',
        className
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink-faint">
        {icon}
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-faint">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// --- Confirm dialog ----------------------------------------------------------
// In-page confirmation instead of window.confirm(): browser-native dialogs can
// be suppressed by the browser (or inside embedded frames) and silently no-op.

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <p className="text-sm leading-relaxed text-ink-dim">{message}</p>}
      {error && (
        <p className="mt-3 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">{error}</p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy && <Spinner />} {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// --- Copy button -------------------------------------------------------------

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="subtle"
      className="!px-3 !py-1.5 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // clipboard unavailable — nothing to do
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : (label ?? 'Copy')}
    </Button>
  );
}
