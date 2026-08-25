import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHubSocket } from './lib/ws';
import { router } from './router';
import { ToastProvider } from './components/ui/toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 5_000 },
  },
});

// Live status changes invalidate the connector queries so badges update instantly.
createHubSocket((event) => {
  if (event.type === 'status') {
    void queryClient.invalidateQueries({ queryKey: ['connectors'] });
    void queryClient.invalidateQueries({ queryKey: ['stats'] });
  }
});

/** Apply persisted theme before first paint to avoid a flash of dark. */
export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
}

export function App() {
  useEffect(() => {
    const saved = localStorage.getItem('hub-theme');
    if (saved === 'light' || saved === 'dark') applyTheme(saved);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
