'use client';

import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.myFunctions.getCurrentUser);

  return (
    <header className="bg-background sticky top-0 z-10 border-b border-slate-200 px-6 py-3">
      <div className="container mx-auto flex h-8.5 flex-row items-center justify-between">
        <Link href="/" className="text-xl font-semibold transition-opacity hover:opacity-80">
          Spot
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {currentUser?.username && (
              <span className="text-sm font-medium text-slate-600">{currentUser.username}</span>
            )}
            {currentUser?.role === 'admin' && (
              <Link href="/admin" title="Admin Panel" className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50">
                <ShieldCheck className="h-4.5 w-4.5" />
              </Link>
            )}
            <Link href="/settings" title="Settings" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
              <Settings className="h-4.5 w-4.5" />
            </Link>
            <button
              onClick={() => void signOut()}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
