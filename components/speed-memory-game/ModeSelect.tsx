"use client";

import React from "react";
import { ArrowRight, Shuffle } from "lucide-react";
import { Difficulty, RevealMode } from "./types";

interface ModeSelectProps {
  title?: string;
  description?: string;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: (mode: RevealMode, diff: Difficulty) => void;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({ title, description, difficulty, setDifficulty, onStart }) => {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-6">
      <div className="w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-1 bg-linear-to-r from-purple-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
          {title}
        </h1>
        <p className="mb-6 text-sm text-slate-500">{description}</p>

        {/* Difficulty */}
        <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Difficulty</p>
        <div className="mb-6 flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
            const meta = {
              easy: { label: "Easy", ms: "3s", color: "green" },
              medium: { label: "Medium", ms: "1.5s", color: "yellow" },
              hard: { label: "Hard", ms: "0.7s", color: "red" },
            }[d];
            const active = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex flex-1 flex-col items-center rounded-xl border-2 py-3 text-sm font-semibold transition-all active:scale-95 ${
                  active
                    ? d === "easy"
                      ? "border-green-400 bg-green-50 text-green-700"
                      : d === "medium"
                        ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                        : "border-red-400 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {meta.label}
                <span className="mt-0.5 text-[10px] font-normal opacity-70">{meta.ms}/card</span>
              </button>
            );
          })}
        </div>

        {/* Reveal mode */}
        <p className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Reveal mode</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onStart("sequential", difficulty)}
            className="group flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-violet-400 hover:bg-violet-50 hover:shadow-sm active:scale-[.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800">Sequential</div>
              <div className="text-xs text-slate-500">Cards revealed left → right, one at a time</div>
            </div>
            <span className="text-slate-300 transition-transform group-hover:translate-x-1">→</span>
          </button>

          <button
            onClick={() => onStart("random", difficulty)}
            className="group flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm active:scale-[.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200">
              <Shuffle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800">Random</div>
              <div className="text-xs text-slate-500">Cards revealed in random order, one at a time</div>
            </div>
            <span className="text-slate-300 transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Rules: </span>
          Watch every card carefully. After all cards have been shown, find all pairs from memory. One wrong click and
          you lose immediately!
        </div>
      </div>
    </div>
  );
};
