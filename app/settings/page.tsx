'use client';

import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { CheckCircle, Loader2, ShieldBan, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const updateUsername = useMutation(api.myFunctions.updateUsername);

  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (currentUser?.username !== undefined) {
      setUsername(currentUser.username ?? '');
    }
  }, [currentUser?.username]);

  if (isLoading || currentUser === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </main>
    );
  }

  if (!currentUser) return null;

  if (currentUser.isBanned) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldBan className="h-12 w-12 text-red-400" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Account Suspended</h1>
        <p className="max-w-sm text-slate-500 dark:text-slate-400">
          Your account has been suspended by an administrator. If you believe this is a mistake, please contact support.
        </p>
        <button
          onClick={() => void signOut()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </main>
    );
  }

  return (
    <SettingsForm
      currentUser={currentUser}
      username={username}
      setUsername={setUsername}
      saving={saving}
      setSaving={setSaving}
      saveStatus={saveStatus}
      setSaveStatus={setSaveStatus}
      saveError={saveError}
      setSaveError={setSaveError}
      updateUsername={updateUsername}
    />
  );
}

function SettingsForm({
  currentUser,
  username,
  setUsername,
  saving,
  setSaving,
  saveStatus,
  setSaveStatus,
  saveError,
  setSaveError,
  updateUsername,
}: {
  currentUser: NonNullable<ReturnType<typeof useQuery<typeof api.myFunctions.getCurrentUser>>>;
  username: string;
  setUsername: (v: string) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  saveStatus: 'idle' | 'success' | 'error';
  setSaveStatus: (v: 'idle' | 'success' | 'error') => void;
  saveError: string;
  setSaveError: (v: string) => void;
  updateUsername: ReturnType<typeof useMutation<typeof api.myFunctions.updateUsername>>;
}) {
  const normalized = username.trim().toLowerCase();
  const isUnchanged = normalized === (currentUser?.username ?? '');
  const isFormatValid = normalized.length >= 3 && normalized.length <= 20 && USERNAME_REGEX.test(normalized);

  const availabilityCheck = useQuery(
    api.myFunctions.checkUsername,
    !saving && isFormatValid && !isUnchanged ? { username: normalized } : 'skip',
  );
  const available: boolean | null = isUnchanged ? true : (availabilityCheck?.available ?? null);

  const showIcon = normalized.length >= 3;
  const isCheckingAvailability = showIcon && !isUnchanged && isFormatValid && available === null;
  const canSave = !saving && !isUnchanged && isFormatValid && available === true;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setSaveError('');
    setSaveStatus('idle');
    try {
      await updateUsername({ username: normalized });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-start p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold">Profile</h2>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSaveStatus('idle');
                    setSaveError('');
                  }}
                  maxLength={20}
                  placeholder="your-username"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
                />
                {showIcon && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2">
                    {isCheckingAvailability ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : !isFormatValid ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : available === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : available === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </span>
                )}
              </div>
              {available === false && !isUnchanged ? (
                <p className="text-xs text-red-500">Username already taken</p>
              ) : normalized.length > 0 && !isFormatValid ? (
                <p className="text-xs text-red-500">
                  {normalized.length < 3
                    ? 'At least 3 characters required'
                    : normalized.length > 20
                      ? 'Maximum 20 characters'
                      : 'Only letters, numbers and hyphens allowed'}
                </p>
              ) : (
                <p className="text-xs text-slate-400">3–20 characters · letters, numbers and hyphens</p>
              )}
            </div>

            {saveStatus === 'error' && <p className="text-sm text-red-600">{saveError}</p>}
            {saveStatus === 'success' && <p className="text-sm text-green-600">Username updated!</p>}

            <button
              type="submit"
              disabled={!canSave}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-base font-semibold">Account Info</h2>
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">E-Mail:</span> {currentUser?.email ?? '—'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">Role:</span>{' '}
            <span
              className={
                currentUser?.role === 'admin'
                  ? 'font-semibold text-purple-600 dark:text-purple-400'
                  : 'text-slate-600 dark:text-slate-400'
              }
            >
              {currentUser?.role ?? 'user'}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
