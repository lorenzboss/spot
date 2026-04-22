'use client';

import { api } from '@/convex/_generated/api';
import { Button, Card, Chip, Input, Spinner } from '@heroui/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { Check, Loader2, ShieldBan, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.userFunctions.getCurrentUser);
  const updateUsername = useMutation(api.userFunctions.updateUsername);

  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const username = usernameDraft ?? currentUser?.username ?? '';

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || currentUser === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (!currentUser) return null;

  if (currentUser.isBanned) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md border border-red-100">
          <Card.Content className="flex flex-col items-center gap-4 p-8 text-center">
            <ShieldBan className="h-12 w-12 text-red-400" />
            <h1 className="text-2xl font-bold text-slate-800">Account Suspended</h1>
            <p className="max-w-sm text-slate-500">
              Your account has been suspended by an administrator. If you believe this is a mistake, please contact
              support.
            </p>
            <Button variant="outline" onPress={() => void handleSignOut()}>
              Sign out
            </Button>
          </Card.Content>
        </Card>
      </main>
    );
  }

  return (
    <SettingsForm
      currentUser={currentUser}
      username={username}
      setUsername={(value) => setUsernameDraft(value)}
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
  currentUser: NonNullable<ReturnType<typeof useQuery<typeof api.userFunctions.getCurrentUser>>>;
  username: string;
  setUsername: (v: string) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  saveStatus: 'idle' | 'success' | 'error';
  setSaveStatus: (v: 'idle' | 'success' | 'error') => void;
  saveError: string;
  setSaveError: (v: string) => void;
  updateUsername: ReturnType<typeof useMutation<typeof api.userFunctions.updateUsername>>;
}) {
  const normalized = username.trim().toLowerCase();
  const isUnchanged = normalized === (currentUser?.username ?? '');
  const isFormatValid = normalized.length >= 3 && normalized.length <= 20 && USERNAME_REGEX.test(normalized);

  const availabilityCheck = useQuery(
    api.userFunctions.checkUsername,
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

        <Card className="border border-slate-200 shadow-sm">
          <Card.Content className="p-6">
            <h2 className="mb-4 text-base font-semibold">Profile</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      setSaveStatus('idle');
                      setSaveError('');
                    }}
                    maxLength={20}
                    placeholder="your-username"
                    className="pr-9"
                  />
                  {showIcon && (
                    <span className="absolute top-1/2 right-3 -translate-y-1/2">
                      {isCheckingAvailability ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : !isFormatValid ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : available === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : available === false ? (
                        <X className="h-4 w-4 text-red-500" />
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
                  <p className="text-xs text-slate-400">3-20 characters · letters, numbers and hyphens</p>
                )}
              </div>

              {saveStatus === 'error' && <p className="text-sm text-red-600">{saveError}</p>}
              {saveStatus === 'success' && (
                <Chip size="sm" variant="soft" className="w-fit bg-green-100 text-green-700">
                  Username updated!
                </Chip>
              )}

              <Button type="submit" isDisabled={!canSave} variant="primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <Card className="mt-4 border border-slate-200 shadow-sm">
          <Card.Content className="p-6">
            <h2 className="mb-2 text-base font-semibold">Account Info</h2>
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">E-Mail:</span> {currentUser?.email ?? '—'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Role:</span>{' '}
              <Chip
                size="sm"
                variant="soft"
                className={
                  currentUser?.role === 'admin' ? 'bg-blue-100 font-semibold text-blue-700' : 'bg-slate-100 text-slate-600'
                }
              >
                {currentUser?.role ?? 'user'}
              </Chip>
            </p>
          </Card.Content>
        </Card>
      </div>
    </main>
  );
}
