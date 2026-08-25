import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cx } from './primitives';

interface ToastItem {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Global toast notifications — mount <ToastProvider> once, call useToast anywhere. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((kind: ToastItem['kind'], message: string) => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev.slice(-4), { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={cx(
                  'animate-pop pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-xl shadow-black/30 backdrop-blur-md',
                  t.kind === 'success'
                    ? 'border-ok/25 bg-ok/10 text-ok'
                    : 'border-bad/25 bg-bad/10 text-bad'
                )}
              >
                {t.kind === 'success' ? (
                  <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                )}
                <span className="leading-snug">{t.message}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // Components outside the provider (shouldn't happen) degrade to a no-op
  // instead of crashing the mutation that called us.
  return ctx ?? { success: () => {}, error: () => {} };
}
