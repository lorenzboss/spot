'use client';

import MemoryGame from '@/components/MemoryGame';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import type { User } from '@workos-inc/node';
import { Authenticated, Unauthenticated } from 'convex/react';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="bg-background sticky top-0 z-10 border-b border-slate-200 px-6 py-3 dark:border-slate-800">
        <div className="container mx-auto flex h-8.5 flex-row items-center justify-between">
          <span className="text-xl font-semibold">Spot</span>
          {user && <UserMenu user={user} onSignOut={signOut} />}
        </div>
      </header>
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
    <main className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center gap-8 p-8">
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
    <main className="container mx-auto flex min-h-[calc(100vh-59px)] flex-col items-center justify-center gap-8 p-4 sm:p-8">
      <MemoryGame title="Offline Mode" description="Play alone and train your memory!" />
    </main>
  );
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <span>
        {user.firstName} {user.lastName}
      </span>
      <button
        onClick={onSignOut}
        className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
      >
        Sign out
      </button>
    </div>
  );
}
