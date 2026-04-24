"use client";

import { useConvexAuth } from "convex/react";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LocalMultiplayerConfigPage() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  const handleSelect = (num: number) => {
    router.push(`/play/local-multiplayer/game?players=${num}`);
  };

  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Users className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Local Multiplayer</h1>
        <p className="mb-8 text-slate-500">How many players are playing?</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => handleSelect(num)}
              className="flex items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 py-3 font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              {num} Players
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
