"use client";

import React from "react";
import { RefreshCw, Settings, Trophy, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameHeaderProps {
  title?: string;
  description?: string;
  playersCount: number;
  isTournament: boolean;
  currentGameIndex: number;
  targetGames: number | "unlimited";
  tournamentHistoryLength: number;
  onShuffle: () => void;
  onShowFinalStandings: () => void;
  onOpenConfig: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  description,
  playersCount,
  isTournament,
  currentGameIndex,
  targetGames,
  tournamentHistoryLength,
  onShuffle,
  onShowFinalStandings,
  onOpenConfig,
}) => {
  const router = useRouter();

  return (
    <div className="mb-4 flex w-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm sm:mb-6 sm:p-4">
      {/* Title and Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="bg-linear-to-r from-blue-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/play/local-multiplayer")}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
            title="Leave Game"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            onClick={onShuffle}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
            title="New Game"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          {playersCount > 1 && (
            <>
              {isTournament && targetGames === "unlimited" && tournamentHistoryLength > 0 && (
                <button
                  onClick={onShowFinalStandings}
                  className="rounded-xl bg-blue-50 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-100 hover:text-blue-700"
                  title="Finish & View Results"
                >
                  <Trophy className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onOpenConfig}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
                title="Manage Players"
              >
                <Settings className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tournament Info */}
      {isTournament && (
        <div className="flex items-center justify-between px-1 text-sm font-medium text-slate-500">
          <span>
            Game {currentGameIndex}
            {targetGames !== "unlimited" ? ` of ${targetGames}` : ""}
          </span>
        </div>
      )}
    </div>
  );
};
