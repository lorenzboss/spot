"use client";

import React from "react";
import { ArrowRight, Shuffle, Trophy } from "lucide-react";
import { Difficulty, RevealMode } from "./types";

interface WinModalProps {
  time: number;
  revealMode: RevealMode | null;
  difficulty: Difficulty;
  currentScore: number | null;
  onRestart: (mode: RevealMode, diff: Difficulty) => void;
  onResetToSelect: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export const WinModal: React.FC<WinModalProps> = ({
  time,
  revealMode,
  difficulty,
  currentScore,
  onRestart,
  onResetToSelect,
}) => {
  const modeLabel = revealMode === "sequential" ? "Sequential" : "Random";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-bounce-in w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
          <Trophy className="h-10 w-10" />
        </div>
        <h2 className="mb-1 text-3xl font-bold text-slate-800">Perfect!</h2>
        <p className="mb-4 text-slate-500">Flawless memory — no mistakes!</p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs tracking-wider text-slate-400 uppercase">Time</div>
            <div className="mt-1 text-xl font-bold text-slate-700">{fmt(time)}</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="text-xs tracking-wider text-slate-400 uppercase">Mode</div>
            <div className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-green-600">
              {revealMode === "sequential" ? <ArrowRight className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}
              {modeLabel}
            </div>
          </div>
          {currentScore !== null && (
            <div className="col-span-2 rounded-lg bg-slate-50 p-3">
              <div className="text-xs tracking-wider text-slate-400 uppercase">Score</div>
              <div className="mt-1 text-xl font-bold text-slate-700">{currentScore.toLocaleString()}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => revealMode && onRestart(revealMode, difficulty)}
            className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 active:scale-95"
          >
            Play Again (same mode)
          </button>
          <button
            onClick={onResetToSelect}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
          >
            Change mode
          </button>
        </div>
      </div>
    </div>
  );
};
