"use client";

import React from "react";
import { PLAYER_CONFIGS, TurnLogEntry } from "./types";

interface StatsGridProps {
  playersCount: number;
  playerMatches: number[];
  currentPlayer: number;
  players: { name: string }[];
  isTournament: boolean;
  tournamentScores: number[];
  time: number;
  turns: number;
  matches: number;
  turnsLog: TurnLogEntry[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  playersCount,
  playerMatches,
  currentPlayer,
  players,
  isTournament,
  tournamentScores,
  time,
  turns,
  matches,
  turnsLog,
}) => {
  if (playersCount > 1) {
    return (
      <div
        className={`grid w-full gap-2 sm:gap-4 ${
          playersCount === 2 ? "grid-cols-2" : playersCount === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        {playerMatches.map((score, index) => {
          const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
          const isActive = currentPlayer === index;
          return (
            <div
              key={index}
              className={`relative rounded-lg p-2 pb-1 text-center transition-all duration-300 sm:p-3 ${
                isActive ? `${theme.bg} ring-2 ${theme.ring} shadow-md` : `bg-slate-50`
              }`}
            >
              {isTournament && (
                <div
                  className={`absolute -top-1.5 -right-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-white px-1.5 text-[10px] font-bold shadow-sm ${theme.bg} ${theme.text} ring-1 ${theme.ring}`}
                  title="Tournament Points"
                >
                  {tournamentScores[index]}
                </div>
              )}
              <span
                className={`block truncate text-[10px] font-semibold tracking-wider uppercase sm:text-xs ${theme.text}`}
              >
                {players[index]?.name || `Player ${index + 1}`}
              </span>
              <div className="flex flex-col items-center">
                <span className={`text-lg font-bold ${theme.text}`}>{score || 0}</span>
                <span className="text-[9px] leading-none font-medium text-slate-400 uppercase">Pairs</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const accuracyCounted = turnsLog.filter((t) => t.countsInAccuracy);
  const accuracyCorrect = accuracyCounted.filter((t) => t.isCorrect).length;
  const accuracyText =
    accuracyCounted.length === 0 ? "-%" : `${Math.round((accuracyCorrect / accuracyCounted.length) * 100)}%`;

  return (
    <div className="grid w-full grid-cols-4 gap-2 sm:gap-4">
      <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
        <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">Time</span>
        <span className="text-lg font-bold text-slate-700">
          {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
        </span>
      </div>

      <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
        <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
          Turns
        </span>
        <span className="text-lg font-bold text-slate-700">{turns}</span>
      </div>

      <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
        <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
          Matches
        </span>
        <span className="text-lg font-bold text-slate-700">{matches}/8</span>
      </div>

      <div className="rounded-lg bg-slate-50 p-2 pb-1 text-center sm:p-3">
        <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
          Accuracy
        </span>
        <span className="text-lg font-bold text-slate-700">{accuracyText}</span>
      </div>
    </div>
  );
};
