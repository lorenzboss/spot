"use client";

import MemoryGame from "@/components/MemoryGame";
import { useConvexAuth } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LocalMultiplayerGamePage() {
  const { isAuthenticated } = useConvexAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialState, setInitialState] = useState<any>(null);
  
  const isTournament = searchParams.get("tournament") === "true";

  useEffect(() => {
    const saved = localStorage.getItem("memory-game-local-multiplayer");
    if (saved) {
      try {
        setInitialState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse game state", e);
        router.push("/play/local-multiplayer");
      }
    } else {
      // If no state in localStorage, redirect back to config
      router.push("/play/local-multiplayer");
    }
  }, [router]);

  if (!isAuthenticated || !initialState) {
    return null;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <MemoryGame 
        title={initialState.isTournament ? "Tournament Mode" : "Local Multiplayer"} 
        description={initialState.isTournament 
          ? `Best of ${initialState.targetGames === "unlimited" ? "∞" : initialState.targetGames} games` 
          : `${initialState.players.length} Players Game`
        } 
        playersCount={initialState.players.length} 
        isTournament={initialState.isTournament}
        initialPlayers={initialState.players}
        targetGames={initialState.targetGames}
        initialTournamentScores={initialState.tournamentScores}
        initialTournamentHistory={initialState.tournamentHistory}
        initialGameIndex={initialState.currentGameIndex}
      />
    </main>
  );
}
