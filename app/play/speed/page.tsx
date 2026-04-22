'use client';

import SpeedMemoryGame from '@/components/SpeedMemoryGame';
import { useConvexAuth } from 'convex/react';

export default function SpeedGamePage() {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <SpeedMemoryGame
        title="Speed Memory"
        description="Remember where every card is. One mistake and it's over!"
      />
    </main>
  );
}
