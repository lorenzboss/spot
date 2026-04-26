"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
}

interface PlayerInputProps {
  player: Player;
  index: number;
  playersCount: number;
  onUpdateName: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export const PlayerInput: React.FC<PlayerInputProps> = ({ player, index, playersCount, onUpdateName, onRemove }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdateName(player.id, e.target.value)}
        placeholder={`Player ${index + 1}`}
        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
      />
      <button
        disabled={playersCount <= 2}
        onClick={() => onRemove(player.id)}
        className={`rounded-lg p-2.5 transition-colors ${
          playersCount <= 2 ? "cursor-not-allowed text-slate-200" : "text-slate-400 hover:bg-red-50 hover:text-red-500"
        }`}
        title={playersCount <= 2 ? "Minimum 2 players required" : "Remove player"}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
