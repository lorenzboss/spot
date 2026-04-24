"use client";

import { Id } from "@/convex/_generated/dataModel";
import { BarChart3 } from "lucide-react";
import Dialog from "./Dialog";

type UserRow = {
  _id: Id<"users">;
  username: string | null;
  email: string | null;
};

interface Props {
  user: UserRow;
  gameStats: {
    userId: Id<"users">;
    totalGames: number;
    averages: {
      score: number;
      turns: number;
      time: number;
      accuracy: number;
    } | null;
    games: {
      _id: string;
      score: number;
      turns: number;
      time: number;
      accuracy: number;
      playedAt: number;
    }[];
  };
  onClose: () => void;
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function UserGamesDialog({ user, gameStats, onClose }: Props) {
  const displayName = user.username ?? user.email ?? "Unknown user";

  return (
    <Dialog title={`Games - ${displayName}`} onClose={onClose} panelClassName="max-w-4xl">
      {gameStats.totalGames === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          This user has not played any games yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Games</div>
              <div className="mt-1 text-lg font-semibold text-slate-800">{gameStats.totalGames}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg score</div>
              <div className="mt-1 text-lg font-semibold text-slate-800">
                {Math.round(gameStats.averages?.score ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg turns</div>
              <div className="mt-1 text-lg font-semibold text-slate-800">
                {(gameStats.averages?.turns ?? 0).toFixed(1)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg time</div>
              <div className="mt-1 text-lg font-semibold text-slate-800">
                {formatTime(gameStats.averages?.time ?? 0)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg accuracy</div>
              <div className="mt-1 text-lg font-semibold text-slate-800">
                {(gameStats.averages?.accuracy ?? 0).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Score</th>
                    <th className="px-3 py-2 text-left">Turns</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Accuracy</th>
                    <th className="px-3 py-2 text-left">Played</th>
                  </tr>
                </thead>
                <tbody>
                  {gameStats.games.map((game, index) => (
                    <tr key={game._id} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono text-slate-500 tabular-nums">{index + 1}</td>
                      <td className="px-3 py-2 font-mono text-slate-800 tabular-nums">{game.score.toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono text-slate-700 tabular-nums">{game.turns}</td>
                      <td className="px-3 py-2 font-mono text-slate-700 tabular-nums">{formatTime(game.time)}</td>
                      <td className="px-3 py-2 font-mono text-slate-700 tabular-nums">{game.accuracy}%</td>
                      <td className="px-3 py-2 text-slate-600">{dateFormatter.format(game.playedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BarChart3 className="h-3.5 w-3.5" />
            Showing all games played by this user.
          </div>
        </div>
      )}
    </Dialog>
  );
}
