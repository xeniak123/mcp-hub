import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Blocks, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Input } from '../components/ui/primitives';

export function LoginPage() {
  const navigate = useNavigate();
  const [usersExist, setUsersExist] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .authStatus()
      .then((r) => setUsersExist(r.usersExist))
      .catch(() => setUsersExist(true));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (usersExist) {
        await api.login(email, password);
      } else {
        await api.bootstrap(email, password);
      }
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="animate-rise w-full max-w-sm">
        <Blocks className="mx-auto h-6 w-6 text-ink" strokeWidth={1.5} />
        <h1 className="mt-4 text-center font-mono text-[13px] font-medium tracking-tight text-ink">
          {usersExist === false ? 'Set up your hub' : 'mcp-hub'}
        </h1>
        <p className="mt-2 text-center text-sm text-ink-dim">
          {usersExist === false
            ? 'Create the administrator account to continue.'
            : 'Sign in to continue.'}
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-3">
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            autoComplete={usersExist === false ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && (
            <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={busy || usersExist === null}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {usersExist === false ? 'Create admin' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
