'use client';

import EditUserDialog from '@/components/EditUserDialog';
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
import { ArrowUpDown, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type UserRow = {
  _id: Id<'users'>;
  username: string | null;
  email: string | null;
  role: string;
  isBanned: boolean;
  highscore: number | null;
};

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const users = useQuery(api.admin.listAllUsers);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'isBanned', desc: false },
    { id: 'role', desc: false },
    { id: 'username', desc: false },
  ]);
  const [editingUserId, setEditingUserId] = useState<Id<'users'> | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (currentUser !== undefined && currentUser?.role !== 'admin'))) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => {
          const isSelf = row.original._id === currentUser?._id;
          return (
            <span className="flex items-center gap-2 font-medium">
              {row.original.username ?? <span className="text-slate-400 italic">—</span>}
              {isSelf && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                  You
                </span>
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
          <span className="text-slate-600 dark:text-slate-400">
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
                role === 'admin'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
              Banned
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
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
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              title="Edit user"
              onClick={() => setEditingUserId(row.original._id)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ),
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
      })),
    [users],
  );

  const editingUser = editingUserId ? (tableData.find((u) => u._id === editingUserId) ?? null) : null;

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

  if (currentUser?.role !== 'admin') return null;

  return (
    <main className="container mx-auto flex flex-1 flex-col gap-6 overflow-auto p-4 py-8 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <span className="text-sm text-slate-500">
          {tableData.length} user{tableData.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={`px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase dark:text-slate-400 ${canSort ? 'cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200' : ''}`}
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
                    className={`border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 ${row.original.isBanned ? 'opacity-55' : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && currentUser && (
        <EditUserDialog user={editingUser} currentAdminId={currentUser._id} onClose={() => setEditingUserId(null)} />
      )}
    </main>
  );
}
