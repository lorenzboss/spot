"use client";

import SpeedMemoryGame from "@/components/SpeedMemoryGame";
import { useConvexAuth } from "convex/react";
import { useSearchParams } from "next/navigation";

type RevealMode = "sequential" | "random";
type Difficulty = "easy" | "medium" | "hard";

export default function SpeedGamePage() {
  const { isAuthenticated } = useConvexAuth();
  const searchParams = useSearchParams();

  const mode = (searchParams.get("mode") as RevealMode) || "sequential";
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "easy";

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <SpeedMemoryGame
        title="Speed Memory"
        description="Remember where every card is. One mistake and it's over!"
        initialMode={mode}
        initialDifficulty={difficulty}
      />
    </main>
  );
}
