'use client';

import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { ShieldBan } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

export default function BannedGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.myFunctions.getCurrentUser);

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  if (isAuthenticated && currentUser?.isBanned) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldBan className="h-12 w-12 text-red-400" />
        <h1 className="text-2xl font-bold text-slate-800">Account Suspended</h1>
        <p className="max-w-sm text-slate-500">
          Your account has been suspended by an administrator. If you believe this is a mistake, please contact support.
        </p>
        <button
          onClick={() => void handleSignOut()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
