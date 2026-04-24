"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, Medal, Shuffle } from "lucide-react";

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "bg-green-100 text-green-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  hard: { label: "Hard", color: "bg-red-100 text-red-700" },
};

export default function SpeedLeaderboard() {
  const topScores = useQuery(api.scoreFunctions.getSpeedTopScores);

  const empty = !topScores || topScores.length === 0;

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        <Medal className="h-5 w-5 text-violet-500 sm:h-6 sm:w-6" />
        <h3 className="text-lg font-bold text-slate-800 sm:text-xl">Speed Memory</h3>
      </div>

      {empty ? (
        <p className="text-center text-sm text-slate-500 sm:text-base">No speed games finished yet. Be the first!</p>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {topScores.map((score, index) => {
            const diff = DIFFICULTY_META[score.difficulty ?? "easy"];
            return (
              <div
                key={score._id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  {/* Rank badge */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${
                      index === 0
                        ? "bg-yellow-200 text-yellow-700"
                        : index === 1
                          ? "bg-gray-200 text-gray-700"
                          : index === 2
                            ? "bg-orange-200 text-orange-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-700 sm:text-base">
                      {score.username ?? "Anonymous"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {/* Difficulty badge */}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${diff.color}`}>
                        {diff.label}
                      </span>
                      {/* Reveal mode badge */}
                      {score.revealMode === "sequential" ? (
                        <span className="flex items-center gap-0.5 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                          <ArrowRight className="h-2.5 w-2.5" /> Seq
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                          <Shuffle className="h-2.5 w-2.5" /> Rnd
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="text-right">
                  <div className="text-base leading-none font-bold text-violet-600 sm:text-lg">
                    {formatTime(score.time)}
                  </div>
                  <div className="text-[10px] text-slate-500 sm:text-xs">time</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
