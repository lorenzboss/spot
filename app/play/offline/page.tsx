'use client';

import MemoryGame from '@/components/MemoryGame';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function OfflineGamePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <MemoryGame title="Offline Mode" description="Play alone and train your memory!" />
    </main>
  );
}
