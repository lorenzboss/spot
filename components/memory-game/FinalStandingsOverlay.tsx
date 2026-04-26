"use client";

import { RefreshCw, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { PLAYER_CONFIGS } from "./types";

interface FinalStandingsOverlayProps {
  history: { winners: number[] }[];
  players: { name: string }[];
  onClose: () => void;
  onRestart: () => void;
}

export const FinalStandingsOverlay: React.FC<FinalStandingsOverlayProps> = ({
  history,
  players,
  onClose,
  onRestart,
}) => {
  const [phase, setPhase] = useState<"recap" | "podium">("recap");
  const [currentGameIndex, setCurrentGameIndex] = useState(-1);
  const [visualScores, setVisualScores] = useState<number[]>(Array(players.length).fill(0));
  const [visualScoresForIcons, setVisualScoresForIcons] = useState<number[]>(Array(players.length).fill(0));

  // Sequence controller
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === "recap") {
      // Start the process
      if (currentGameIndex === -1) {
        timer = setTimeout(() => setCurrentGameIndex(0), 500);
      }
      // Handle score update for current game
      else if (currentGameIndex < history.length) {
        // First, update the visual scores after a short delay to match animation
        const scoreTimer = setTimeout(() => {
          const winners = history[currentGameIndex].winners;

          if (winners.length > 1) {
            // Draw: everyone gets 1 point
            const update = (prev: number[]) => {
              const next = [...prev];
              winners.forEach((w) => (next[w] += 1));
              return next;
            };
            setVisualScores(update);
            setVisualScoresForIcons(update);
          } else if (winners.length === 1) {
            // Solo win: icon scales immediately by 2, number counts up 1 -> 2
            const winnerIdx = winners[0];
            setVisualScoresForIcons((prev) => {
              const next = [...prev];
              next[winnerIdx] += 2;
              return next;
            });

            setVisualScores((prev) => {
              const next = [...prev];
              next[winnerIdx] += 1;
              return next;
            });

            setTimeout(() => {
              setVisualScores((prev) => {
                const next = [...prev];
                next[winnerIdx] += 1;
                return next;
              });
            }, 200);
          }

          // Then, after showing the result for a bit, move to next game or podium
          timer = setTimeout(() => {
            if (currentGameIndex < history.length - 1) {
              setCurrentGameIndex((prev) => prev + 1);
            } else {
              // Wait 1 second after the final game before showing podium
              timer = setTimeout(() => setPhase("podium"), 1000);
            }
          }, 600);
        }, 200);

        return () => {
          clearTimeout(scoreTimer);
          clearTimeout(timer);
        };
      }
    }

    return () => clearTimeout(timer);
  }, [phase, currentGameIndex, history]);

  const finalScores = Array(players.length).fill(0);
  history.forEach((game) => {
    if (game.winners.length > 1) {
      game.winners.forEach((w) => (finalScores[w] += 1));
    } else if (game.winners.length === 1) {
      finalScores[game.winners[0]] += 2;
    }
  });

  const maxTournamentScore = Math.max(...finalScores, 1);
  const displayScores = phase === "podium" ? finalScores : visualScores;
  const currentWinners =
    currentGameIndex >= 0 && currentGameIndex < history.length ? history[currentGameIndex].winners : [];

  const sortedUniqueScores = Array.from(new Set(displayScores)).sort((a, b) => b - a);
  const rankGroups = sortedUniqueScores.slice(0, 3).map((score, i) => ({
    rank: i + 1,
    score,
    playerIndices: players.map((_, idx) => idx).filter((idx) => displayScores[idx] === score),
  }));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-500">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white/90 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:max-w-xl">
        <div className="relative flex min-h-[400px] flex-col bg-linear-to-b from-white to-slate-50/50 p-8 sm:p-12">
          {/* Skip button (only in recap) */}
          {phase === "recap" && (
            <button
              onClick={() => setPhase("podium")}
              className="absolute top-8 right-8 z-10 rounded-full bg-slate-200/50 p-2 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 active:scale-90"
              title="Skip"
            >
              <span className="px-2 text-xs font-bold uppercase">Skip</span>
            </button>
          )}

          {/* Recap Phase */}
          {phase === "recap" && (
            <div className="animate-fade-in flex flex-1 flex-col">
              <div className="text-center">
                <h3 className="mb-2 text-2xl font-black tracking-wider text-slate-800 uppercase">
                  Game {Math.max(currentGameIndex + 1, 1)}{" "}
                  <span className="text-lg text-slate-400">/ {history.length}</span>
                </h3>
              </div>

              <div className="flex flex-1 items-end justify-center gap-6 sm:gap-10">
                {players.map((player, index) => {
                  const score = visualScores[index];
                  const iconScore = visualScoresForIcons[index];
                  const theme = PLAYER_CONFIGS[index % PLAYER_CONFIGS.length];
                  const isWinner = currentWinners.includes(index);
                  const pointsEarned = currentWinners.length > 1 ? "+1" : "+2";

                  // Calculate dynamic scale based on immediate iconScore
                  const iconScale = 1 + (iconScore / maxTournamentScore) * 0.5;

                  return (
                    <div key={index} className="relative flex flex-col items-center justify-end">
                      {/* Icon Container */}
                      <div
                        className={`relative flex items-center justify-center rounded-full border shadow-lg transition-all duration-500 ${theme.bg} ${theme.text}`}
                        style={{
                          borderColor: theme.ring,
                          width: "4rem",
                          height: "4rem", // base size 64px
                          transform: `scale(${iconScale})`,
                          transformOrigin: "bottom center",
                          zIndex: isWinner ? 10 : 1,
                        }}
                      >
                        <User className="h-1/2 w-1/2" />

                        {/* Floating points animation */}
                        {isWinner && (
                          <div
                            key={currentGameIndex}
                            className="animate-float-up absolute -top-4 -right-4 z-20"
                            style={{ transform: `scale(${1 / iconScale})` }}
                          >
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg ring-2 ${theme.bg} ${theme.ring} font-black ${theme.text} text-xs`}
                            >
                              {pointsEarned}
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="mt-8 max-w-[80px] truncate text-center font-bold text-slate-700">
                        {player.name}
                      </span>
                      <span className="text-sm font-black text-slate-500">{score} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Podium Phase */}
          {phase === "podium" && (
            <div className="animate-bounce-in flex flex-1 flex-col">
              <div className="mb-10 text-center">
                <h2 className="text-4xl font-black tracking-tight text-slate-800 uppercase">Final Standings</h2>
              </div>

              <div className="mb-2 flex h-48 flex-1 items-end justify-center gap-2 sm:gap-4">
                {/* 2nd Place Group */}
                {rankGroups.length > 1 && (
                  <div
                    className="animate-fade-in flex flex-col items-center justify-end"
                    style={{ animationDelay: "300ms", animationFillMode: "both" }}
                  >
                    <div className="mb-2 flex flex-col items-center">
                      {rankGroups[1].playerIndices.map((idx) => (
                        <span key={idx} className="max-w-[80px] truncate leading-tight font-bold text-slate-600">
                          {players[idx].name}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`flex h-32 w-20 flex-col items-center justify-start rounded-t-2xl border-x-2 border-t-2 border-slate-300 bg-slate-200 pt-4 sm:w-24`}
                    >
                      <span className="text-2xl font-black text-slate-500">2</span>
                      <span className="text-sm font-bold text-slate-500">{rankGroups[1].score} pts</span>
                    </div>
                  </div>
                )}

                {/* 1st Place Group */}
                {rankGroups.length > 0 && (
                  <div
                    className="animate-fade-in z-10 flex flex-col items-center justify-end"
                    style={{ animationDelay: "100ms", animationFillMode: "both" }}
                  >
                    <div className="mb-2 flex flex-col items-center">
                      {rankGroups[0].playerIndices.map((idx) => (
                        <span
                          key={idx}
                          className="max-w-[100px] truncate text-lg leading-tight font-black text-slate-900"
                        >
                          {players[idx].name}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`flex h-40 w-24 flex-col items-center justify-start rounded-t-2xl border-x-2 border-t-2 border-yellow-400 bg-yellow-300 pt-4 shadow-[0_0_30px_rgba(253,224,71,0.5)] sm:w-28`}
                    >
                      <span className="text-4xl font-black text-yellow-700">1</span>
                      <span className="font-bold text-yellow-700">{rankGroups[0].score} pts</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place Group */}
                {rankGroups.length > 2 && (
                  <div
                    className="animate-fade-in flex flex-col items-center justify-end"
                    style={{ animationDelay: "500ms", animationFillMode: "both" }}
                  >
                    <div className="mb-2 flex flex-col items-center">
                      {rankGroups[2].playerIndices.map((idx) => (
                        <span key={idx} className="max-w-[80px] truncate leading-tight font-bold text-slate-600">
                          {players[idx].name}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`flex h-24 w-20 flex-col items-center justify-start rounded-t-2xl border-x-2 border-t-2 border-orange-300 bg-orange-200 pt-4 sm:w-24`}
                    >
                      <span className="text-2xl font-black text-orange-700">3</span>
                      <span className="text-sm font-bold text-orange-700">{rankGroups[2].score} pts</span>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="animate-fade-in mt-8 flex gap-3"
                style={{ animationDelay: "1000ms", animationFillMode: "both" }}
              >
                <button
                  onClick={onRestart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  <RefreshCw className="h-5 w-5" /> Play Again
                </button>
                <button
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white py-4 text-base font-bold text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
