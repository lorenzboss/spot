'use client';

import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import Link from 'next/link';

export default function Header() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.myFunctions.getCurrentUser);

  return (
    <header className="bg-background sticky top-0 z-10 border-b border-slate-200 px-6 py-3 dark:border-slate-800">
      <div className="container mx-auto flex h-8.5 flex-row items-center justify-between">
        <Link href="/" className="text-xl font-semibold transition-opacity hover:opacity-80">
          Spot
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {currentUser?.username && (
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{currentUser.username}</span>
            )}
            <button
              onClick={() => void signOut()}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
