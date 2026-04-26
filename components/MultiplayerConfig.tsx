"use client";

import { Plus, Trash2, Users, X } from "lucide-react";
import React, { useState } from "react";

interface Player {
  id: string;
  name: string;
}

interface MultiplayerConfigProps {
  initialPlayers?: Player[];
  initialIsTournament?: boolean;
  initialGameCount?: number | "unlimited";
  onStart: (players: Player[], isTournament: boolean, gameCount: number | "unlimited") => void;
  onCancel?: () => void;
  isDialog?: boolean;
  minGameCount?: number;
}

export default function MultiplayerConfig({
  initialPlayers = [
    { id: "1", name: "Player 1" },
    { id: "2", name: "Player 2" },
  ],
  initialIsTournament = false,
  initialGameCount = 3,
  onStart,
  onCancel,
  isDialog = false,
  minGameCount,
}: MultiplayerConfigProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isTournament, setIsTournament] = useState(initialIsTournament);
  const [gameCount, setGameCount] = useState<number | "unlimited">(initialGameCount);

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, { id: Math.random().toString(36).substr(2, 9), name: `Player ${players.length + 1}` }]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleStart = () => {
    onStart(players, isTournament, gameCount);
  };

  const content = (
    <div className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg ${isDialog ? "mx-auto" : ""}`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Game Setup</h2>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Tournament Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <div className="font-semibold text-slate-700">Tournament Mode</div>
            <div className="text-xs text-slate-500">Track scores across multiple games</div>
          </div>
          <button
            onClick={() => setIsTournament(!isTournament)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isTournament ? "bg-blue-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isTournament ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Players List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-600 uppercase">Players</label>
            <span className="text-xs text-slate-400">{players.length}/4</span>
          </div>
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center gap-2">
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayerName(player.id, e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
              />
              <button
                disabled={players.length <= 2}
                onClick={() => removePlayer(player.id)}
                className={`rounded-lg p-2.5 transition-colors ${
                  players.length <= 2
                    ? "text-slate-200 cursor-not-allowed"
                    : "text-slate-400 hover:bg-red-50 hover:text-red-500"
                }`}
                title={players.length <= 2 ? "Minimum 2 players required" : "Remove player"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {players.length < 4 && (
            <button
              onClick={addPlayer}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" /> Add Player
            </button>
          )}
        </div>

        {/* Game Count Selection (Only for Tournament) */}
        {isTournament && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-600 uppercase">Number of Games</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, "unlimited"].map((count) => {
                const isTooSmall = typeof count === "number" && minGameCount !== undefined && count < minGameCount;
                return (
                  <button
                    key={count}
                    disabled={isTooSmall}
                    onClick={() => setGameCount(count as number | "unlimited")}
                    className={`rounded-xl border py-2 text-sm font-semibold transition-all ${
                      gameCount === count
                        ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                        : isTooSmall
                          ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {count === "unlimited" ? "∞" : count}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-[0.98]"
        >
          {isDialog ? "Save Changes" : "Start Game"}
        </button>
      </div>
    </div>
  );

  if (isDialog) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="animate-in zoom-in-95 duration-200 w-full max-w-md">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
