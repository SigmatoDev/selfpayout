'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ApiResource, RetailerSummary } from '@/lib/types';

type StoreType = 'KIRANA' | 'RESTAURANT' | 'TRAIN';

const MarketplacePage = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiResource<RetailerSummary[]>>('retailers/public')
  });

  const storeThumbnailClass = (storeType: StoreType) => {
    if (storeType === 'KIRANA') return 'bg-amber-100 text-amber-700';
    if (storeType === 'TRAIN') return 'bg-indigo-100 text-indigo-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const filteredStores = useMemo(() => {
    const stores = data?.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter(
      (store) => store.shopName.toLowerCase().includes(term) || store.storeType.toLowerCase().includes(term)
    );
  }, [data?.data, search]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10 text-slate-900 dark:text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Marketplace</p>
          <h1 className="text-2xl font-semibold">All stores</h1>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
        >
          Back
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Browse stores</h2>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="surface-input w-full rounded-xl px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60 sm:max-w-xs"
            placeholder="Search by store or category..."
          />
        </div>
        {isLoading ? <p className="mt-3 text-xs text-slate-500">Loading…</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filteredStores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => {
                router.push(`/store/${store.id}?name=${encodeURIComponent(store.shopName)}&type=${store.storeType}`);
              }}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${storeThumbnailClass(
                  store.storeType
                )}`}
              >
                {store.shopName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{store.shopName}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {store.storeType.toLowerCase()}
                </p>
              </div>
            </button>
          ))}
          {!filteredStores.length && !isLoading ? (
            <p className="text-sm text-slate-500">No stores match your search.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default MarketplacePage;
