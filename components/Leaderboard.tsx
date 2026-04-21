'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Medal } from 'lucide-react';

export default function Leaderboard() {
  const topScores = useQuery(api.myFunctions.getTopScores);

  if (!topScores || topScores.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Medal className="h-6 w-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-slate-800">Leaderboard</h3>
        </div>
        <p className="text-center text-slate-500">No games played yet. Be the first to set a record!</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Medal className="h-6 w-6 text-yellow-500" />
        <h3 className="text-xl font-bold text-slate-800">Leaderboard</h3>
      </div>
      <div className="space-y-2">
        {topScores.map((score, index) => (
          <div key={score._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? 'bg-yellow-100 text-yellow-600'
                    : index === 1
                      ? 'bg-gray-100 text-gray-600'
                      : index === 2
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {index + 1}
              </div>
              <div>
                <div className="text-base font-semibold text-slate-700">{score.username ?? 'Anonymous'}</div>
                <div className="text-sm text-slate-500">
                  {score.turns} turns · {Math.floor(score.time / 60)}:{(score.time % 60).toString().padStart(2, '0')} ·{' '}
                  {score.accuracy}% acc
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">{score.score}</div>
              <div className="text-xs text-slate-500">score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
