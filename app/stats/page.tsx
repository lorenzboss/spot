"use client";

import { api } from "@/convex/_generated/api";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowUpDown, ChevronDown, ChevronUp, RotateCcw, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 p-4">
      <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</span>
      <span className="mt-0.5 text-xl font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="h-3.5 w-3.5" />;
  if (sorted === "desc") return <ChevronDown className="h-3.5 w-3.5" />;
  return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
}

// ─── Row types ────────────────────────────────────────────────────────────────

type ClassicRow = {
  _id: string;
  score: number;
  turns: number;
  time: number;
  accuracy: number;
  playedAt: number;
};

type SpeedRow = {
  _id: string;
  score: number;
  time: number;
  difficulty: string;
  revealMode: string;
  playedAt: number;
};

// ─── Classic Table ────────────────────────────────────────────────────────────

function ClassicTable({ games }: { games: ClassicRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "playedAt", desc: true }]);

  const columns = useMemo<ColumnDef<ClassicRow>[]>(
    () => [
      {
        id: "index",
        header: () => <span>#</span>,
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-slate-400 tabular-nums">{row.index + 1}</span>,
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-slate-800 tabular-nums">
            {getValue<number>().toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "turns",
        header: "Turns",
        cell: ({ getValue }) => <span className="font-mono text-slate-700 tabular-nums">{getValue<number>()}</span>,
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ getValue }) => (
          <span className="font-mono text-slate-700 tabular-nums">{formatTime(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "accuracy",
        header: "Accuracy",
        cell: ({ getValue }) => <span className="font-mono text-slate-700 tabular-nums">{getValue<number>()}%</span>,
      },
      {
        accessorKey: "playedAt",
        header: "Played",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-slate-500">{dateFormatter.format(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: games,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
  });

  return <SortableTable table={table} countLabel={`${games.length} game${games.length !== 1 ? "s" : ""} played`} />;
}

// ─── Speed Table ──────────────────────────────────────────────────────────────

function SpeedTable({ games }: { games: SpeedRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "playedAt", desc: true }]);

  const columns = useMemo<ColumnDef<SpeedRow>[]>(
    () => [
      {
        id: "index",
        header: () => <span>#</span>,
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-slate-400 tabular-nums">{row.index + 1}</span>,
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-slate-800 tabular-nums">
            {getValue<number>().toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ getValue }) => (
          <span className="font-mono text-slate-700 tabular-nums">{formatTime(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "difficulty",
        header: "Difficulty",
        cell: ({ getValue }) => {
          const d = getValue<string>();
          return (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                d === "hard"
                  ? "bg-red-100 text-red-700"
                  : d === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {capitalize(d)}
            </span>
          );
        },
        sortingFn: (a, b) => {
          const order = { easy: 0, medium: 1, hard: 2 };
          return (
            (order[a.original.difficulty as keyof typeof order] ?? 0) -
            (order[b.original.difficulty as keyof typeof order] ?? 0)
          );
        },
      },
      {
        accessorKey: "revealMode",
        header: "Reveal Mode",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-slate-700">{capitalize(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "playedAt",
        header: "Played",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-slate-500">{dateFormatter.format(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: games,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
  });

  return <SortableTable table={table} countLabel={`${games.length} game${games.length !== 1 ? "s" : ""} played`} />;
}

// ─── Shared table shell ───────────────────────────────────────────────────────

function SortableTable({ table, countLabel }: { table: any; countLabel: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <span className="mr-2 text-sm text-slate-500">{countLabel}</span>
      </div>
      <div
        className="min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border border-slate-200 bg-white shadow-sm"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        <table className="w-max min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                {headerGroup.headers.map((header: any) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase ${canSort ? "cursor-pointer select-none hover:text-slate-800" : ""}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-slate-400">
                            <SortIcon sorted={sorted} />
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row: any) => (
              <tr key={row.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50">
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "classic" | "speed";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const stats = useQuery(api.userFunctions.getMyGameStats, isAuthenticated ? {} : "skip");
  const [activeTab, setActiveTab] = useState<Tab>("classic");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/sign-in");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || stats === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </main>
    );
  }

  if (!isAuthenticated || stats === null) return null;

  const classic = stats.classic;
  const speed = stats.speed;

  return (
    <main className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col gap-6 p-4 py-8 sm:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Stats</h1>
        <span className="text-sm text-slate-500">
          {stats.totalGames} game{stats.totalGames !== 1 ? "s" : ""} played
        </span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {(["classic", "speed"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "classic" ? <RotateCcw className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {capitalize(tab)} Mode
          </button>
        ))}
      </div>

      {/* ── Classic Mode ──────────────────────────────────────────────────── */}
      {activeTab === "classic" && (
        <>
          {classic.totalGames === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              No classic games played yet.
            </div>
          ) : (
            <>
              {/* Overview card */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-700">Overview</h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4">
                  <StatCell label="Highscore" value={classic.highscore?.toLocaleString() ?? "—"} />
                  <StatCell label="Best turns" value={classic.bestTurns ?? "—"} />
                  <StatCell label="Best time" value={classic.bestTime != null ? formatTime(classic.bestTime) : "—"} />
                  <StatCell
                    label="Best accuracy"
                    value={classic.bestAccuracy != null ? `${classic.bestAccuracy.toFixed(1)}%` : "—"}
                  />
                  <StatCell
                    label="Avg score"
                    value={classic.averages ? Math.round(classic.averages.score).toLocaleString() : "—"}
                  />
                  <StatCell label="Avg turns" value={classic.averages ? classic.averages.turns.toFixed(1) : "—"} />
                  <StatCell label="Avg time" value={classic.averages ? formatTime(classic.averages.time) : "—"} />
                  <StatCell
                    label="Avg accuracy"
                    value={classic.averages ? `${classic.averages.accuracy.toFixed(1)}%` : "—"}
                  />
                </div>
              </div>

              {/* History table */}
              <ClassicTable games={classic.games} />
            </>
          )}
        </>
      )}

      {/* ── Speed Mode ────────────────────────────────────────────────────── */}
      {activeTab === "speed" && (
        <>
          {speed.totalGames === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              No speed games played yet.
            </div>
          ) : (
            <>
              {/* Overview card */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-700">Overview</h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3">
                  <StatCell label="Highscore" value={speed.highscore?.toLocaleString() ?? "—"} />
                  <StatCell label="Best time" value={speed.bestTime != null ? formatTime(speed.bestTime) : "—"} />
                  <StatCell
                    label="Best difficulty"
                    value={speed.bestDifficulty ? capitalize(speed.bestDifficulty) : "—"}
                  />
                  <StatCell
                    label="Best Reveal mode"
                    value={speed.bestRevealMode ? capitalize(speed.bestRevealMode) : "—"}
                  />
                  <StatCell
                    label="Avg score"
                    value={speed.averages ? Math.round(speed.averages.score).toLocaleString() : "—"}
                  />
                  <StatCell label="Avg time" value={speed.averages ? formatTime(speed.averages.time) : "—"} />
                </div>
              </div>

              {/* History table */}
              <SpeedTable games={speed.games} />
            </>
          )}
        </>
      )}
    </main>
  );
}
