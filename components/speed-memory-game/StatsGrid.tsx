"use client";

import React from "react";
import { GamePhase, TOTAL_PAIRS } from "./types";

interface StatsGridProps {
  time: number;
  matches: number;
  phase: GamePhase;
  revealProgress: [number, number];
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export const StatsGrid: React.FC<StatsGridProps> = ({ time, matches, phase, revealProgress }) => {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Time</span>
          <span className="text-lg font-bold text-slate-700">{fmt(time)}</span>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Matches</span>
          <span className="text-lg font-bold text-slate-700">
            {matches}/{TOTAL_PAIRS}
          </span>
        </div>
        <div
          className={`rounded-lg p-2 text-center transition-colors ${
            phase === "revealing" ? "bg-violet-50" : "bg-slate-50"
          }`}
        >
          <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            {phase === "revealing" ? "Shown" : "Matched"}
          </span>
          <span
            className={`text-lg font-bold ${
              phase === "revealing" ? "text-violet-600" : phase === "lost" ? "text-red-500" : "text-slate-700"
            }`}
          >
            {phase === "revealing" ? `${revealProgress[0]}/${revealProgress[1]}` : `${matches}/${TOTAL_PAIRS}`}
          </span>
        </div>
      </div>

      {/* Progress bar — always rendered to avoid layout shift */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            phase === "lost"
              ? "bg-linear-to-r from-red-400 to-rose-400"
              : "bg-linear-to-r from-violet-500 to-purple-500"
          }`}
          style={{
            width:
              phase === "revealing"
                ? `${revealProgress[1] > 0 ? (revealProgress[0] / revealProgress[1]) * 100 : 0}%`
                : `${(matches / TOTAL_PAIRS) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
