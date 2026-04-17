'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import type { User } from '@workos-inc/node';
import Link from 'next/link';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-background sticky top-0 z-10 border-b border-slate-200 px-6 py-3 dark:border-slate-800">
      <div className="container mx-auto flex h-8.5 flex-row items-center justify-between">
        <Link href="/" className="text-xl font-semibold transition-opacity hover:opacity-80">
          Spot
        </Link>
        {user && <UserMenu user={user} onSignOut={signOut} />}
      </div>
    </header>
  );
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">
        {user.firstName} {user.lastName}
      </span>
      <button
        onClick={onSignOut}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
      >
        Sign out
      </button>
    </div>
  );
}
