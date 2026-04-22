'use client';

import { api } from '@/convex/_generated/api';
import { Button, Card } from '@heroui/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { ShieldBan } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

export default function BannedGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.userFunctions.getCurrentUser);

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  if (isAuthenticated && currentUser?.isBanned) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md border border-red-100">
          <Card.Content className="flex flex-col items-center gap-4 p-8 text-center">
            <ShieldBan className="h-12 w-12 text-red-400" />
            <h1 className="text-2xl font-bold text-slate-800">Account Suspended</h1>
            <p className="max-w-sm text-slate-500">
              Your account has been suspended by an administrator. If you believe this is a mistake, please contact
              support.
            </p>
            <Button variant="outline" onPress={() => void handleSignOut()}>
              Sign out
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
