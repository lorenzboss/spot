"use client";

import React from "react";
import { Trophy } from "lucide-react";
import { PLAYER_CONFIGS, TurnLogEntry } from "./types";

interface WinModalProps {
  playersCount: number;
  playerMatches: number[];
  players: { name: string }[];
  isTournament: boolean;
  tournamentScores: number[];
  turns: number;
  time: number;
  turnsLog: TurnLogEntry[];
  currentScore: number | null;
  currentGameIndex: number;
  targetGames: number | "unlimited";
  onAction: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  playersCount,
  playerMatches,
  players,
  isTournament,
  tournamentScores,
  turns,
  time,
  turnsLog,
  currentScore,
  currentGameIndex,
  targetGames,
  onAction,
}) => {
  const accuracyCounted = turnsLog.filter((t) => t.countsInAccuracy);
  const accuracyCorrect = accuracyCounted.filter((t) => t.isCorrect).length;
  const accuracyText =
    accuracyCounted.length === 0 ? "-%" : `${Math.round((accuracyCorrect / accuracyCounted.length) * 100)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-bounce-in w-full max-w-sm scale-100 transform rounded-3xl bg-white p-8 text-center shadow-xl transition-all">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
          <Trophy className="h-10 w-10" />
        </div>

        {playersCount > 1 ? (
          <>
            <h2 className="mb-2 text-3xl font-bold text-slate-800">
              {(() => {
                const maxScore = Math.max(...playerMatches);
                const winners = playerMatches
                  .map((score, index) => (score === maxScore ? index : -1))
                  .filter((i) => i !== -1);
                if (winners.length > 1) return "It's a Tie!";
                return `${players[winners[0]]?.name || `Player ${winners[0] + 1}`} Wins!`;
              })()}
            </h2>
            <div className="mb-4 text-sm font-medium text-slate-500">
              {isTournament ? "Current Game Results" : "Game Over"}
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
              {playerMatches.map((score, index) => {
                const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                return (
                  <div key={index} className={`rounded-xl border border-slate-100 p-3 text-center ${theme.bg}`}>
                    <div className={`text-[10px] font-bold tracking-wider uppercase ${theme.text}`}>
                      {players[index]?.name || `Player ${index + 1}`}
                    </div>
                    <div className="text-xl font-bold text-slate-800">{score} Pairs</div>
                  </div>
                );
              })}
            </div>

            {isTournament && (
              <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <h3 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Tournament Standings
                </h3>
                <div className="space-y-2">
                  {tournamentScores.map((score, index) => {
                    const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`font-semibold ${theme.text}`}>{players[index]?.name}</span>
                        <span className="font-bold text-slate-700">{score} Points</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="mb-2 text-3xl font-bold text-slate-800">You Won!</h2>
            <p className="mb-4 text-slate-500">
              Completed in <span className="font-bold text-blue-600">{turns}</span> turns
            </p>

            <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs tracking-wider text-slate-400 uppercase">Time</div>
                <div className="mt-1 font-bold text-slate-700">
                  {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs tracking-wider text-slate-400 uppercase">Accuracy</div>
                <div className="mt-1 font-bold text-slate-700">{accuracyText}</div>
              </div>
              {currentScore !== null && (
                <div className="col-span-2 rounded-lg bg-slate-50 p-3">
                  <div className="text-xs tracking-wider text-slate-400 uppercase">Score</div>
                  <div className="mt-1 text-xl font-bold text-slate-700">{currentScore.toLocaleString()}</div>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onAction}
          className="w-full rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          {isTournament
            ? targetGames !== "unlimited" && currentGameIndex >= targetGames
              ? "View Final Standings"
              : "Next Game"
            : "Play Again"}
        </button>
      </div>
    </div>
  );
};
