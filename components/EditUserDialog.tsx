'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button, Card, Chip, Input, Spinner } from '@heroui/react';
import { useMutation, useQuery } from 'convex/react';
import { Check, Shield, ShieldOff, Trash2, TriangleAlert, UserCheck, UserX, X } from 'lucide-react';
import { useState } from 'react';
import Dialog from './Dialog';

const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserRow = {
  _id: Id<'users'>;
  username: string | null;
  email: string | null;
  role: string;
  isBanned: boolean;
  highscore: number | null;
};

interface Props {
  user: UserRow;
  currentAdminId: Id<'users'>;
  onClose: () => void;
}

export default function EditUserDialog({ user, currentAdminId, onClose }: Props) {
  const adminUpdateUsername = useMutation(api.admin.adminUpdateUsername);
  const adminUpdateEmail = useMutation(api.admin.adminUpdateEmail);
  const setBanStatus = useMutation(api.admin.setBanStatus);
  const setUserRole = useMutation(api.admin.setUserRole);
  const deleteUser = useMutation(api.admin.deleteUser);

  const [username, setUsername] = useState(user.username ?? '');
  const [email, setEmail] = useState(user.email ?? '');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState('');

  const isSelf = user._id === currentAdminId;

  // --- Username validation ---
  const normalizedUsername = username.trim().toLowerCase();
  const usernameUnchanged = normalizedUsername === (user.username ?? '');
  const usernameFormatValid =
    normalizedUsername.length >= 3 && normalizedUsername.length <= 20 && USERNAME_REGEX.test(normalizedUsername);

  const usernameAvailabilityCheck = useQuery(
    api.userFunctions.checkUsername,
    !saving && usernameFormatValid && !usernameUnchanged ? { username: normalizedUsername } : 'skip',
  );
  const usernameAvailable: boolean | null = usernameUnchanged ? true : (usernameAvailabilityCheck?.available ?? null);
  const usernameChecking = !usernameUnchanged && usernameFormatValid && usernameAvailable === null;
  const usernameValid = usernameUnchanged || (usernameFormatValid && usernameAvailable === true);

  // --- Email validation ---
  const normalizedEmail = email.trim().toLowerCase();
  const emailUnchanged = normalizedEmail === (user.email ?? '');
  const emailFormatValid = EMAIL_REGEX.test(normalizedEmail);

  const emailAvailabilityCheck = useQuery(
    api.userFunctions.checkEmail,
    !saving && emailFormatValid && !emailUnchanged ? { email: normalizedEmail } : 'skip',
  );
  const emailTaken: boolean | null = emailUnchanged ? false : (emailAvailabilityCheck?.exists ?? null);
  const emailChecking = !emailUnchanged && emailFormatValid && emailTaken === null;
  const emailValid = emailUnchanged || (emailFormatValid && emailTaken === false);

  // --- Save button ---
  const nothingChanged = usernameUnchanged && emailUnchanged;
  const canSave = !saving && !nothingChanged && usernameValid && emailValid && !usernameChecking && !emailChecking;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setSaveError('');
    try {
      if (!usernameUnchanged) {
        await adminUpdateUsername({ userId: user._id, username: normalizedUsername });
      }
      if (!emailUnchanged) {
        await adminUpdateEmail({ userId: user._id, email: normalizedEmail });
      }
      onClose();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Unknown error');
      setSaving(false);
    }
  }

  async function handleBan(isBanned: boolean) {
    setActionError('');
    try {
      await setBanStatus({ userId: user._id, isBanned });
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function handleRole(role: 'user' | 'admin') {
    setActionError('');
    try {
      await setUserRole({ userId: user._id, role });
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function handleDelete() {
    setActionError('');
    try {
      await deleteUser({ userId: user._id });
      onClose();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  return (
    <Dialog title="Edit User" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Username</label>
          <div className="relative">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              maxLength={20}
              className="pr-9"
            />
            {normalizedUsername.length >= 3 && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2">
                {usernameChecking ? (
                  <Spinner size="sm" />
                ) : !usernameFormatValid ? (
                  <X className="h-4 w-4 text-red-500" />
                ) : usernameAvailable === true ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : usernameAvailable === false ? (
                  <X className="h-4 w-4 text-red-500" />
                ) : null}
              </span>
            )}
          </div>
          {usernameAvailable === false && !usernameUnchanged ? (
            <p className="text-xs text-red-500">Username already taken</p>
          ) : normalizedUsername.length > 0 && !usernameFormatValid ? (
            <p className="text-xs text-red-500">
              {normalizedUsername.length < 3
                ? 'At least 3 characters required'
                : 'Only letters, numbers and hyphens allowed'}
            </p>
          ) : (
            <p className="text-xs text-slate-400">3–20 characters · letters, numbers and hyphens</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">E-Mail</label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-9"
            />
            {normalizedEmail.length > 0 && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2">
                {emailChecking ? (
                  <Spinner size="sm" />
                ) : !emailFormatValid ? (
                  <X className="h-4 w-4 text-red-500" />
                ) : emailTaken ? (
                  <X className="h-4 w-4 text-red-500" />
                ) : emailTaken === false ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : null}
              </span>
            )}
          </div>
          {!emailFormatValid && normalizedEmail.length > 0 ? (
            <p className="text-xs text-red-500">Please enter a valid email address.</p>
          ) : emailTaken && !emailUnchanged ? (
            <p className="text-xs text-red-500">This email is already registered.</p>
          ) : (
            <p className="text-xs text-slate-400">Used to sign in</p>
          )}
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <Button onPress={handleSave} isDisabled={!canSave} variant="primary">
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>

        {/* Divider */}
        <hr className="border-slate-200" />

        {/* Role & Ban toggles */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Account</p>
          {isSelf && (
            <Chip size="sm" variant="soft" className="w-fit bg-slate-100 px-3 py-2 text-xs text-slate-500">
              You cannot ban, revoke or delete your own account.
            </Chip>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role toggle */}
            {user.role === 'admin' ? (
              <Button
                isDisabled={isSelf}
                onPress={() => handleRole('user')}
                title={isSelf ? 'Cannot change your own role' : 'Revoke admin'}
                variant="outline"
                className="text-amber-700"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Revoke Admin
              </Button>
            ) : (
              <Button onPress={() => handleRole('admin')} variant="outline" className="text-blue-700">
                <Shield className="h-3.5 w-3.5" />
                Make Admin
              </Button>
            )}
            {/* Ban toggle */}
            {user.isBanned ? (
              <Button
                isDisabled={isSelf}
                onPress={() => handleBan(false)}
                variant="outline"
                className="text-emerald-700"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Unban User
              </Button>
            ) : (
              <Button
                isDisabled={isSelf}
                onPress={() => handleBan(true)}
                title={isSelf ? 'Cannot ban yourself' : 'Ban user'}
                variant="outline"
                className="text-red-700"
              >
                <UserX className="h-3.5 w-3.5" />
                Ban User
              </Button>
            )}
          </div>
          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
        </div>

        {/* Danger zone */}
        {!isSelf && (
          <>
            <hr className="border-slate-200" />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Danger Zone</p>
              {showDeleteConfirm ? (
                <Card className="border border-red-200 bg-red-50 shadow-none">
                  <Card.Content className="p-3">
                  <div className="mb-3 flex items-start gap-2 text-sm text-red-700">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>This permanently deletes the user and all their scores. This cannot be undone.</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onPress={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                    <Button onPress={handleDelete} variant="danger" className="flex-1">
                      Yes, delete
                    </Button>
                  </div>
                  </Card.Content>
                </Card>
              ) : (
                <Button onPress={() => setShowDeleteConfirm(true)} variant="outline" className="self-start text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete User
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
