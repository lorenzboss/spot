"use client";

import Leaderboard from "@/components/Leaderboard";
import SpeedLeaderboard from "@/components/SpeedLeaderboard";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Gamepad2, Globe, Lock, Zap, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  return (
    <>
      <AuthLoading>{null}</AuthLoading>
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}

function SignInForm() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Spot</h1>
        <p className="mb-8 text-slate-500">Sign in to start playing</p>
        <div className="flex flex-col gap-3">
          <a
            href="/sign-in"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white! transition-colors hover:bg-blue-700"
          >
            Sign in
          </a>
          <a
            href="/sign-up"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Create account
          </a>
        </div>
      </div>
    </main>
  );
}

function Content() {
  const [activeBoard, setActiveBoard] = useState<"classic" | "speed">("classic");

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-start gap-4 p-3 py-4 sm:gap-6 sm:p-8">
      {/* Game Modes Section */}
      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {/* Offline Mode */}
        <Link
          href="/play/offline"
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-400 hover:shadow-sm sm:p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:h-12 sm:w-12">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800 sm:text-base">Offline Mode</h3>
            <p className="text-[11px] text-slate-500 sm:text-xs">Play solo</p>
          </div>
          <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
        </Link>

        {/* Speed Memory Mode */}
        <Link
          href="/play/speed"
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-purple-400 hover:shadow-sm sm:p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 sm:h-12 sm:w-12">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800 sm:text-base">Speed Memory</h3>
            <p className="text-[11px] text-slate-500 sm:text-xs">No mistakes allowed!</p>
          </div>
          <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
        </Link>

        {/* Local Multiplayer Mode */}
        <Link
          href="/play/local-multiplayer"
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-green-400 hover:shadow-sm sm:p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 sm:h-12 sm:w-12">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800 sm:text-base">Local Multiplayer</h3>
            <p className="text-[11px] text-slate-500 sm:text-xs">Play with friends</p>
          </div>
          <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
        </Link>

        {/* Online Mode - Coming Soon */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 opacity-50 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 sm:h-12 sm:w-12">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-600 sm:text-base">Online Mode</h3>
            <p className="text-[11px] text-slate-500 sm:text-xs">Coming soon</p>
          </div>
          <Lock className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="w-full max-w-xl">
        {/* Tab toggle */}
        <div className="mb-3 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setActiveBoard("classic")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeBoard === "classic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            Classic
          </button>
          <button
            onClick={() => setActiveBoard("speed")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeBoard === "speed" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Zap className="h-4 w-4" />
            Speed Memory
          </button>
        </div>

        <div className={activeBoard === "classic" ? "block" : "hidden"}>
          <Leaderboard />
        </div>
        <div className={activeBoard === "speed" ? "block" : "hidden"}>
          <SpeedLeaderboard />
        </div>
      </div>
    </main>
  );
}
