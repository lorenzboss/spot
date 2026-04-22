'use client';

import { Button, Card, Input, Link as HeroLink, Spinner } from '@heroui/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  useEffect(() => {
    if (isAuthenticated && pendingRedirect) {
      router.replace('/');
    }
  }, [isAuthenticated, pendingRedirect, router]);

  if (pendingRedirect) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <Spinner size="lg" />
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn('password', { email, password, flow: 'signIn' });
      setPendingRedirect(true);
      return;
    } catch {
      setError('Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <Card className="w-full max-w-sm border border-slate-200 shadow-sm">
        <Card.Content className="p-8">
          <h1 className="mb-6 text-center text-2xl font-bold">Sign in</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" isDisabled={loading} variant="primary">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            No account?{' '}
            <HeroLink href="/sign-up" className="text-blue-600">
              Sign up
            </HeroLink>
          </p>
        </Card.Content>
      </Card>
    </main>
  );
}
