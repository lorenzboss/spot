'use client';

import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { Check, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function isPasswordValid(pw: string) {
  return pw.length >= PASSWORD_MIN_LENGTH;
}

export default function SignUpPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  useEffect(() => {
    if (isAuthenticated && pendingRedirect) {
      router.replace('/');
    }
  }, [isAuthenticated, pendingRedirect, router]);

  const usernameCheck = useQuery(
    api.userFunctions.checkUsername,
    !loading && username.trim().length >= 3 && USERNAME_REGEX.test(username.trim()) ? { username } : 'skip',
  );
  const usernameAvailable = usernameCheck?.available ?? null;

  const emailCheck = useQuery(
    api.userFunctions.checkEmail,
    !loading && EMAIL_REGEX.test(email.trim()) ? { email: email.trim() } : 'skip',
  );
  const emailTaken = emailCheck?.exists ?? false;
  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordValid = isPasswordValid(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError(null);
    if (!USERNAME_REGEX.test(username.trim())) {
      setError('Only letters, numbers and hyphens are allowed in the username.');
      return;
    }
    if (usernameAvailable === false) {
      setError('That username is already taken.');
      return;
    }
    if (emailTaken) {
      setError('An account with this email already exists. Please sign in instead.');
      return;
    }
    if (!passwordValid) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    setLoading(true);
    try {
      await signIn('password', { email, password, username, flow: 'signUp' });
      setPendingRedirect(true);
      // Keep loading=true; useEffect will navigate once isAuthenticated is confirmed
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Username')) {
        setError(msg);
      } else {
        setError('Could not create account. The email may already be in use.');
      }
      setLoading(false);
    }
  }

  if (pendingRedirect) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign up</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-9 text-sm outline-none focus:border-blue-400"
              />
              {!loading && username.trim().length >= 3 && (
                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                  {usernameAvailable === null ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : usernameAvailable ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              )}
            </div>
            {usernameAvailable === false && !pendingRedirect ? (
              <p className="text-xs text-red-500">Username already taken</p>
            ) : (
              <p className="text-xs text-slate-400">3–20 characters · letters, numbers and hyphens</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-9 text-sm outline-none focus:border-blue-400"
              />
              {touched.email && email.length > 0 && (
                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                  {!emailValid ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : emailTaken ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </span>
              )}
            </div>
            {touched.email && !emailValid && email.length > 0 && !loading ? (
              <p className="text-xs text-red-500">Please enter a valid email address.</p>
            ) : touched.email && emailTaken && !loading ? (
              <p className="text-xs text-red-500">
                Already registered.{' '}
                <a href="/sign-in" className="underline">
                  Sign in instead?
                </a>
              </p>
            ) : (
              <p className="text-xs text-slate-400">You&apos;ll use this to sign in later</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-9 text-sm outline-none focus:border-blue-400"
              />
              {touched.password && password.length > 0 && (
                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                  {passwordValid ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </span>
              )}
            </div>
            <p
              className={`text-xs ${touched.password && password.length > 0 && !passwordValid ? 'text-red-500' : 'text-slate-400'}`}
            >
              At least {PASSWORD_MIN_LENGTH} characters
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || usernameAvailable === false || emailTaken}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <a href="/sign-in" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
