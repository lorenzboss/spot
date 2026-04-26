"use client";

import MemoryGame from "@/components/MemoryGame";
import { useConvexAuth } from "convex/react";
import { useSearchParams } from "next/navigation";

export default function LocalMultiplayerGamePage() {
  const { isAuthenticated } = useConvexAuth();
  const searchParams = useSearchParams();
  
  const namesStr = searchParams.get("names") || "Player 1,Player 2";
  const names = namesStr.split(",");
  const isTournament = searchParams.get("tournament") === "true";
  const gameCountStr = searchParams.get("games") || "3";
  const gameCount = gameCountStr === "unlimited" ? "unlimited" : parseInt(gameCountStr, 10);
  
  // New persistence params
  const scoresStr = searchParams.get("scores");
  const initialScores = scoresStr ? scoresStr.split(",").map(Number) : undefined;
  const historyStr = searchParams.get("history");
  const initialHistory = historyStr ? historyStr.split("|").map(h => ({ winners: h.split(",").map(Number) })) : undefined;
  const initialGameIndex = parseInt(searchParams.get("current") || "1", 10);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <MemoryGame 
        title={isTournament ? "Tournament Mode" : "Local Multiplayer"} 
        description={isTournament ? `Best of ${gameCount === "unlimited" ? "∞" : gameCount} games` : `${names.length} Players Game`} 
        playersCount={names.length} 
        isTournament={isTournament}
        initialPlayers={names.map(name => ({ name }))}
        targetGames={gameCount}
        initialTournamentScores={initialScores}
        initialTournamentHistory={initialHistory}
        initialGameIndex={initialGameIndex}
      />
    </main>
  );
}
