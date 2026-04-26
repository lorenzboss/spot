"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import MultiplayerConfig from "@/components/MultiplayerConfig";

export default function LocalMultiplayerConfigPage() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  const handleStart = (players: { id: string; name: string }[], isTournament: boolean, gameCount: number | "unlimited") => {
    const names = players.map(p => p.name).join(",");
    router.push(`/play/local-multiplayer/game?names=${encodeURIComponent(names)}&tournament=${isTournament}&games=${gameCount}`);
  };

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <MultiplayerConfig onStart={handleStart} />
    </main>
  );
}
