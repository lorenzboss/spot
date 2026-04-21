'use client';

import Leaderboard from '@/components/Leaderboard';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { Gamepad2, Globe, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <AuthLoading>{null}</AuthLoading>
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
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Spot</h1>
        <p className="mb-8 text-slate-500">Sign in to start playing</p>
        <div className="flex flex-col gap-3">
          <a
            href="/sign-in"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white! transition-colors hover:bg-indigo-700"
          >
            Sign in
          </a>
          <a
            href="/sign-up"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Create account
          </a>
        </div>
      </div>
    </main>
  );
}

function Content() {
  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-start gap-6 overflow-auto p-4 py-8 sm:p-8">
      {/* Game Modes Section */}
      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {/* Offline Mode */}
        <Link
          href="/play/offline"
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-sm"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">Offline Mode</h3>
            <p className="text-xs text-slate-500">Play solo</p>
          </div>
          <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
        </Link>

        {/* Online Mode - Coming Soon */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
            <Globe className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-600">Online Mode</h3>
            <p className="text-xs text-slate-500">Coming soon</p>
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
