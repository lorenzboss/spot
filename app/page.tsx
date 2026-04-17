'use client';

import Leaderboard from '@/components/Leaderboard';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Authenticated, Unauthenticated } from 'convex/react';
import { Gamepad2, Globe, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}

function SignInForm() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-auto p-8">
      <div className="rounded-xl border-2 p-12 text-center">
        <h1 className="mb-4 text-center text-4xl font-bold">Spot</h1>
        <p className="whitespace-nowrap sm:text-lg">
          <a href="/sign-in">Log in </a>
          or <a href="/sign-up">Sign up </a>
          to continue!
        </p>
      </div>
    </main>
  );
}

function Content() {
  const { user } = useAuth();

  if (!user) {
    return <div className="mx-auto"></div>;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-start gap-6 overflow-auto p-4 py-8 sm:p-8">
      {/* Game Modes Section */}
      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {/* Offline Mode */}
        <Link
          href="/play/offline"
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 dark:text-white">Offline Mode</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Play solo</p>
          </div>
          <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
        </Link>

        {/* Online Mode - Coming Soon */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-50 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
            <Globe className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-600 dark:text-slate-500">Online Mode</h3>
            <p className="text-xs text-slate-500 dark:text-slate-600">Coming soon</p>
          </div>
          <Lock className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="w-full max-w-xl">
        <Leaderboard />
      </div>
    </main>
  );
}
