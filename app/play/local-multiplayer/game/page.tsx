"use client";

import MemoryGame from "@/components/MemoryGame";
import { useConvexAuth } from "convex/react";
import { useSearchParams } from "next/navigation";

export default function LocalMultiplayerGamePage() {
  const { isAuthenticated } = useConvexAuth();
  const searchParams = useSearchParams();
  const playersCount = parseInt(searchParams.get("players") || "2", 10);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <MemoryGame 
        title="Local Multiplayer" 
        description={`${playersCount} Players Game`} 
        playersCount={playersCount} 
      />
    </main>
  );
}
