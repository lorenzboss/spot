"use client";

import { Plus, Users, X } from "lucide-react";
import { useState } from "react";
import { PlayerInput } from "./multiplayer-config/PlayerInput";

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
  const [players, setPlayers] = useState<Player[]>(
    initialPlayers.map((p, index) => ({
      ...p,
      name: p.name === `Player ${index + 1}` ? "" : p.name,
    })),
  );
  const [isTournament, setIsTournament] = useState(initialIsTournament);
  const [gameCount, setGameCount] = useState<number | "unlimited">(initialGameCount);

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, { id: Math.random().toString(36).substr(2, 9), name: "" }]);
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
    const finalPlayers = players.map((p, index) => ({
      ...p,
      name: p.name.trim() || `Player ${index + 1}`,
    }));
    onStart(finalPlayers, isTournament, gameCount);
  };

  const content = (
    <div
      className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg ${isDialog ? "mx-auto" : ""}`}
    >
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

      <div className="space-y-4">
        {/* Tournament Toggle - Only visible on initial setup or specific dialogs */}
        {!isDialog && (
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <div className="font-semibold text-slate-700">Tournament Mode</div>
              <div className="text-xs text-slate-500">Track scores across multiple games (Win: 2 pts, Tie: 1 pt)</div>
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
        )}

        {/* Players List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-600 uppercase">Players</div>
            <span className="text-xs text-slate-400">{players.length}/4</span>
          </div>
          <div className="space-y-2">
            {players.map((player, index) => (
              <PlayerInput
                key={player.id}
                player={player}
                index={index}
                playersCount={players.length}
                onUpdateName={updatePlayerName}
                onRemove={removePlayer}
              />
            ))}
            {players.length < 4 && (
              <button
                onClick={addPlayer}
                className="flex h-[44.85px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                <Plus className="h-4 w-4" /> Add Player
              </button>
            )}
          </div>
        </div>

        {/* Tournament Settings */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isTournament ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="space-y-4 pt-1 pb-2">
            <div className="space-y-3">
              <div className="mb-2 text-sm font-semibold text-slate-600 uppercase">Number of Games</div>
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
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {count === "unlimited" ? "∞" : count}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

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
      <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm duration-200">
        <div className="animate-in zoom-in-95 w-full max-w-md duration-200">{content}</div>
      </div>
    );
  }

  return content;
}
