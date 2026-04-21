'use client';

import EditUserDialog from '@/components/EditUserDialog';
import UserGamesDialog from '@/components/UserGamesDialog';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useConvexAuth, useQuery } from 'convex/react';
import { ArrowUpDown, BarChart3, ChevronDown, ChevronUp, Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type UserRow = {
  _id: Id<'users'>;
  username: string | null;
  email: string | null;
  role: string;
  isBanned: boolean;
  highscore: number | null;
  gamesPlayed: number;
};

type UserGameStats = {
  userId: Id<'users'>;
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

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const isAdmin = isAuthenticated && currentUser?.role === 'admin';
  const users = useQuery(api.admin.listAllUsers, isAdmin ? {} : 'skip');

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'isBanned', desc: false },
    { id: 'role', desc: false },
    { id: 'username', desc: false },
  ]);
  const [editingUserId, setEditingUserId] = useState<Id<'users'> | null>(null);
  const [loadingGamesUserId, setLoadingGamesUserId] = useState<Id<'users'> | null>(null);
  const [viewingGamesUserId, setViewingGamesUserId] = useState<Id<'users'> | null>(null);
  const [viewingGameStats, setViewingGameStats] = useState<UserGameStats | null>(null);

  const loadedGameStats = useQuery(
    api.admin.getUserGameStats,
    isAdmin && loadingGamesUserId ? { userId: loadingGamesUserId } : 'skip',
  );

  useEffect(() => {
    if (!loadingGamesUserId || loadedGameStats === undefined) return;
    if (loadedGameStats.userId !== loadingGamesUserId) return;

    setViewingGamesUserId(loadingGamesUserId);
    setViewingGameStats(loadedGameStats);
    setLoadingGamesUserId(null);
  }, [loadedGameStats, loadingGamesUserId]);

  function openGamesDialog(userId: Id<'users'>) {
    setViewingGamesUserId(null);
    setViewingGameStats(null);
    setLoadingGamesUserId(userId);
  }

  function closeGamesDialog() {
    setViewingGamesUserId(null);
    setViewingGameStats(null);
    setLoadingGamesUserId(null);
  }

  useEffect(() => {
    if (isLoading || currentUser === undefined) return;
    if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-start gap-1">
            <button
              title="Show games"
              aria-label={`Show games for ${row.original.username ?? 'user'}`}
              onClick={() => openGamesDialog(row.original._id)}
              disabled={loadingGamesUserId !== null}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {loadingGamesUserId === row.original._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
            </button>
            <button
              title="Edit user"
              aria-label={`Edit ${row.original.username ?? 'user'}`}
              onClick={() => setEditingUserId(row.original._id)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => {
          const isSelf = row.original._id === currentUser?._id;
          return (
            <span className="flex items-center gap-2 font-medium">
              {row.original.username ?? <span className="text-slate-400 italic">—</span>}
              {isSelf && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">You</span>
              )}
            </span>
          );
        },
        sortingFn: 'alphanumericCaseSensitive',
      },
      {
        accessorKey: 'email',
        header: 'E-Mail',
        cell: ({ getValue }) => (
          <span className="text-slate-600">
            {getValue<string | null>() ?? <span className="text-slate-400 italic">—</span>}
          </span>
        ),
        sortingFn: 'alphanumericCaseSensitive',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => {
          const role = getValue<string>();
          return (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {role}
            </span>
          );
        },
      },
      {
        accessorKey: 'isBanned',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Banned</span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Active
            </span>
          ),
        sortingFn: (a, b) => Number(a.original.isBanned) - Number(b.original.isBanned),
      },
      {
        accessorKey: 'highscore',
        header: 'Highscore',
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return (
            <span className="font-mono text-sm tabular-nums">
              {v != null ? v.toLocaleString() : <span className="text-slate-400">—</span>}
            </span>
          );
        },
        sortingFn: (a, b) => (a.original.highscore ?? -1) - (b.original.highscore ?? -1),
      },
      {
        accessorKey: 'gamesPlayed',
        header: 'Games',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-slate-700 tabular-nums">{getValue<number>().toLocaleString()}</span>
        ),
        sortingFn: (a, b) => a.original.gamesPlayed - b.original.gamesPlayed,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?._id],
  );

  const tableData = useMemo<UserRow[]>(
    () =>
      (users ?? []).map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned,
        highscore: u.highscore,
        gamesPlayed: u.gamesPlayed ?? 0,
      })),
    [users],
  );

  const editingUser = editingUserId ? (tableData.find((u) => u._id === editingUserId) ?? null) : null;
  const viewingGamesUser = viewingGamesUserId ? (tableData.find((u) => u._id === viewingGamesUserId) ?? null) : null;

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
  });

  if (isLoading || currentUser === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </main>
    );
  }

  if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') return null;

  return (
    <main className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col gap-6 p-4 py-8 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <span className="text-sm text-slate-500">
          {tableData.length} user{tableData.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        className="min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border border-slate-200 bg-white shadow-sm"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        <table className="w-max min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase ${canSort ? 'cursor-pointer select-none hover:text-slate-800' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-slate-400">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
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
            {users === undefined ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-slate-100 transition-colors hover:bg-slate-50 ${row.original.isBanned ? 'opacity-55' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingUser && currentUser && (
        <EditUserDialog user={editingUser} currentAdminId={currentUser._id} onClose={() => setEditingUserId(null)} />
      )}
      {viewingGamesUser && viewingGameStats && (
        <UserGamesDialog user={viewingGamesUser} gameStats={viewingGameStats} onClose={closeGamesDialog} />
      )}
    </main>
  );
}
