"use client";

import React from "react";
import { ArrowRight, RefreshCw, Shuffle, Undo2 } from "lucide-react";
import { Difficulty, RevealMode } from "./types";

interface GameHeaderProps {
  title?: string;
  revealMode: RevealMode | null;
  difficulty: Difficulty;
  onResetToSelect: () => void;
  onStartGame: (mode: RevealMode, diff: Difficulty) => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  revealMode,
  difficulty,
  onResetToSelect,
  onStartGame,
}) => {
  const modeLabel = revealMode === "sequential" ? "Sequential" : "Random";

  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm sm:mb-5 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="bg-linear-to-r from-purple-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
            {title}
          </h1>
          <div className="mt-0.5 flex items-center gap-1.5">
            {revealMode === "sequential" ? (
              <ArrowRight className="h-3.5 w-3.5 text-violet-500" />
            ) : (
              <Shuffle className="h-3.5 w-3.5 text-violet-500" />
            )}
            <span className="text-xs font-medium text-slate-400">{modeLabel} mode</span>
            <span
              className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                difficulty === "easy"
                  ? "bg-green-100 text-green-700"
                  : difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>
        </div>
        {/* Change mode + Restart buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetToSelect}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
            title="Change mode"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => revealMode && onStartGame(revealMode, difficulty)}
            className="rounded-xl bg-slate-100 p-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
            title="Restart (same mode)"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
