'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Medal } from 'lucide-react';

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function formatScore(score: number) {
  return Math.trunc(score)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export default function Leaderboard() {
  const topScores = useQuery(api.myFunctions.getTopScores);

  if (!topScores || topScores.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <Medal className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6" />
          <h3 className="text-lg font-bold text-slate-800 sm:text-xl">Leaderboard</h3>
        </div>
        <p className="text-center text-sm text-slate-500 sm:text-base">
          No games played yet. Be the first to set a record!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        <Medal className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6" />
        <h3 className="text-lg font-bold text-slate-800 sm:text-xl">Leaderboard</h3>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {topScores.map((score, index) => (
          <div key={score._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 sm:p-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${
                  index === 0
                    ? 'bg-yellow-200 text-yellow-700'
                    : index === 1
                      ? 'bg-gray-200 text-gray-700'
                      : index === 2
                        ? 'bg-orange-200 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-700 sm:text-base">
                  {score.username ?? 'Anonymous'}
                </div>
                <div className="truncate text-[11px] text-slate-500 sm:text-sm">
                  {score.turns} turns · {formatTime(score.time)} · {score.accuracy}% acc
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base leading-none font-bold text-blue-600 sm:text-lg">
                {formatScore(score.score)}
              </div>
              <div className="text-[10px] text-slate-500 sm:text-xs">score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
