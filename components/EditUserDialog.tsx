'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  CheckCircle,
  Loader2,
  Shield,
  ShieldOff,
  Trash2,
  TriangleAlert,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
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
    api.myFunctions.checkUsername,
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
    api.myFunctions.checkEmail,
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
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              maxLength={20}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
            />
            {normalizedUsername.length >= 3 && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2">
                {usernameChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : !usernameFormatValid ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : usernameAvailable === true ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : usernameAvailable === false ? (
                  <XCircle className="h-4 w-4 text-red-500" />
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
            />
            {normalizedEmail.length > 0 && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2">
                {emailChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : !emailFormatValid ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : emailTaken ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : emailTaken === false ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
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

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        {/* Divider */}
        <hr className="border-slate-200 dark:border-slate-700" />

        {/* Role & Ban toggles */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Account</p>
          {isSelf && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              You cannot ban, revoke or delete your own account.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role toggle */}
            {user.role === 'admin' ? (
              <button
                disabled={isSelf}
                onClick={() => handleRole('user')}
                title={isSelf ? 'Cannot change your own role' : 'Revoke admin'}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Revoke Admin
              </button>
            ) : (
              <button
                onClick={() => handleRole('admin')}
                className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
              >
                <Shield className="h-3.5 w-3.5" />
                Make Admin
              </button>
            )}
            {/* Ban toggle */}
            {user.isBanned ? (
              <button
                disabled={isSelf}
                onClick={() => handleBan(false)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Unban User
              </button>
            ) : (
              <button
                disabled={isSelf}
                onClick={() => handleBan(true)}
                title={isSelf ? 'Cannot ban yourself' : 'Ban user'}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                <UserX className="h-3.5 w-3.5" />
                Ban User
              </button>
            )}
          </div>
          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
        </div>

        {/* Danger zone */}
        {!isSelf && (
          <>
            <hr className="border-slate-200 dark:border-slate-700" />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Danger Zone</p>
              {showDeleteConfirm ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
                  <div className="mb-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>This permanently deletes the user and all their scores. This cannot be undone.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Yes, delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 self-start rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete User
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
