import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Blocks, LayoutGrid, Moon, Settings as SettingsIcon, Store, Sun } from 'lucide-react';
import { cx } from '../ui/primitives';
import { api } from '../../lib/api';
import { applyTheme } from '../../App';
import { useGlobalShortcuts } from './shortcuts';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function useTheme(): ['dark' | 'light', () => void] {
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('hub-theme', next);
    setTheme(next);
  };
  return [theme, toggle];
}

export function Shell() {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  useGlobalShortcuts(navigate);

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100dvh-3rem)] w-56 shrink-0 flex-col sm:flex">
          <div className="mb-10 flex items-center gap-2.5 px-2 pt-1">
            <Blocks className="h-[18px] w-[18px] text-ink" strokeWidth={1.75} />
            <span className="font-mono text-[13px] font-medium tracking-tight text-ink">mcp-hub</span>
          </div>

          <nav className="flex flex-col gap-0.5" aria-label="Main">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                    isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-dim'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* active rail */}
                    <span
                      className={cx(
                        'absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-ink transition-opacity duration-200',
                        isActive ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 px-3 pb-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-xs text-ink-faint transition-colors hover:text-ink-dim"
              type="button"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              onClick={() => void api.logout().then(() => navigate('/login'))}
              className="text-xs text-ink-faint transition-colors hover:text-ink-dim"
              type="button"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 pb-24 sm:pb-16">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function MobileNav() {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/50 sm:hidden"
      aria-label="Mobile"
    >
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cx(
              'flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-[10px] transition-colors',
              isActive ? 'bg-white/5 text-ink' : 'text-ink-faint'
            )
          }
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
