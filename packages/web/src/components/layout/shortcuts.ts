import { useEffect } from 'react';

/**
 * Global keyboard shortcuts:
 *  - `/` focuses the visible search field (dashboard or marketplace)
 *  - Esc closes the topmost modal
 *  - `g` then d/m/s jumps to Dashboard / Marketplace / Settings
 */
export function useGlobalShortcuts(navigate: (to: string) => void): void {
  useEffect(() => {
    let gPending = false;
    let gTimer: ReturnType<typeof setTimeout> | undefined;

    const isTypingTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Modals listen for their own Esc via the backdrop; here we only
        // blur so a second Esc doesn't fight with browser focus behavior.
        if (isTypingTarget(e.target)) (e.target as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (gPending) {
        gPending = false;
        clearTimeout(gTimer);
        const dest = { d: '/', m: '/marketplace', s: '/settings' }[e.key.toLowerCase()];
        if (dest && !isTypingTarget(e.target)) {
          e.preventDefault();
          navigate(dest);
          return;
        }
      }

      if (e.key === '/') {
        if (isTypingTarget(e.target)) return;
        const field =
          document.querySelector<HTMLInputElement>('#dashboard-search') ??
          document.querySelector<HTMLInputElement>('input[placeholder^="Search connectors"]');
        if (field) {
          e.preventDefault();
          field.focus();
        }
        return;
      }

      if (e.key.toLowerCase() === 'g' && !isTypingTarget(e.target)) {
        gPending = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          gPending = false;
        }, 1200);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(gTimer);
    };
  }, [navigate]);
}
