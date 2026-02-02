'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import type { User } from '@workos-inc/node';
import { Authenticated, Unauthenticated } from 'convex/react';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-10 bg-background px-6 py-3 border-b border-slate-200 dark:border-slate-800 ">
        <div className="h-8.5 mx-auto container flex flex-row justify-between items-center">
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
    <main className="p-8 flex flex-col justify-center items-center gap-8 min-h-[calc(100vh-60px)]">
      <div className="p-12 rounded-xl border-2 text-center">
        <h1 className="text-4xl mb-4 font-bold text-center">Spot</h1>
        <p className="sm:text-lg whitespace-nowrap">
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
    <main className="container mx-auto p-8 flex flex-col justify-center items-center gap-8 min-h-[calc(100vh-59px)]">
      <p className="text-center">{user.email}</p>
      <p>Hello how are you today?</p>
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
        className="border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
      >
        Sign out
      </button>
    </div>
  );
}
