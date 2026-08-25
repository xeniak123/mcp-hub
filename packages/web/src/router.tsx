import { createBrowserRouter, Navigate } from 'react-router';

import { Shell } from './components/layout/Shell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ConnectorDetailPage } from './pages/ConnectorDetailPage';
import { SettingsPage } from './pages/SettingsPage';

async function requireAuth(): Promise<Response | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) {
    throw new Response('', { status: 302, headers: { Location: '/login' } });
  }
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    Component: Shell,
    loader: requireAuth,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'connectors/:id', element: <ConnectorDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
