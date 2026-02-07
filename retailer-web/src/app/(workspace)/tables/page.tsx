'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CurrentUserResponse, TableInfo } from '@/lib/types';

interface ApiResource<T> {
  data: T;
}

const TablesPage = () => {
  const { data: userData } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.get<CurrentUserResponse>('auth/me')
  });

  const retailerId = userData?.user?.retailerId;

  const queryClient = useQueryClient();
  const [form, setForm] = useState({ label: '', capacity: 2 });

  const { data, isLoading, error } = useQuery({
    queryKey: retailerId ? queryKeys.tables(retailerId) : ['tables', 'missing'],
    queryFn: () => apiClient.get<ApiResource<TableInfo[]>>(`restaurants/${retailerId}/tables`),
    enabled: Boolean(retailerId)
  });

  const upsertMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResource<TableInfo>>(`restaurants/${retailerId}/tables`, {
        label: form.label.trim(),
        capacity: form.capacity
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables(retailerId!) });
      setForm({ label: '', capacity: 2 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (tableId: string) =>
      apiClient.delete<unknown>(`restaurants/${retailerId}/tables/${tableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables(retailerId!) });
    }
  });

  if (!retailerId) {
    return <p className="text-sm text-slate-500">No retailer context found. Please re-login.</p>;
  }

  const tables = data?.data ?? [];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Tables</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          View tables and their capacities. Editing and merge/split will be added next.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200/60 bg-white/50 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add / update table</h2>
        <form
          className="mt-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.label.trim()) return;
            upsertMutation.mutate();
          }}
        >
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-500">Label</span>
            <input
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
              placeholder="e.g., T1, Patio-3"
              required
            />
          </label>
          <label className="flex w-32 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-500">Capacity</span>
            <input
              type="number"
              min={1}
              max={20}
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={upsertMutation.isPending}
            className="rounded-lg bg-[color:var(--green)] px-4 py-2 font-semibold text-slate-900 disabled:opacity-70"
          >
            {upsertMutation.isPending ? 'Saving...' : 'Save table'}
          </button>
        </form>
        {upsertMutation.error ? (
          <p className="mt-2 text-xs text-rose-500">{(upsertMutation.error as Error).message}</p>
        ) : null}
      </section>

      {isLoading ? <p className="text-sm text-slate-500">Loading tables...</p> : null}
      {error ? <p className="text-sm text-rose-500">{(error as Error).message}</p> : null}

      {tables.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {tables.map((table) => (
            <li
              key={table.id}
              className="rounded-xl border border-slate-200/70 bg-white/40 p-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{table.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Capacity: {table.capacity}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    table.status === 'AVAILABLE'
                      ? 'bg-green-100 text-green-700'
                      : table.status === 'OCCUPIED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(table.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded border border-rose-200 px-2 py-1 text-rose-600 hover:border-rose-300 hover:text-rose-700 dark:border-rose-500/60 dark:text-rose-300"
                >
                  {deleteMutation.isPending ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && <p className="text-sm text-slate-500">No tables configured yet.</p>
      )}
    </div>
  );
};

export default TablesPage;
