'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ApiResource, CheckoutSession } from '@/lib/types';

type StoredOrder = { id: string; code: string; startedAt: number };

const OrdersPage = () => {
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('selfcheckout-orders');
    if (!raw) return;
    try {
      setOrders(JSON.parse(raw));
    } catch {
      setOrders([]);
    }
  }, []);

  const queries = useQueries({
    queries: orders.map((order) => ({
      queryKey: queryKeys.session(order.id),
      queryFn: () => apiClient.get<ApiResource<CheckoutSession>>(`self-checkout/sessions/${order.id}`),
      staleTime: 5000
    }))
  });

  const combined = useMemo(() => {
    return orders.map((order, idx) => {
      const q = queries[idx];
      return {
        ...order,
        session: q?.data?.data,
        isLoading: q?.isLoading ?? false,
        error: q?.error as Error | undefined
      };
    });
  }, [orders, queries]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-400">My orders</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Recent bills</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          View sessions you started from this device. Open to track status or add more items.
        </p>
      </header>

      {!orders.length ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-200">
          No orders yet. Start a new checkout to see it here.
        </p>
      ) : (
        <div className="space-y-3">
          {combined.map((entry) => {
            const session = entry.session;
            const status = session?.status ?? 'IN_PROGRESS';
            const statusColor =
              status === 'APPROVED'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : status === 'PAID'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                  : status === 'SUBMITTED'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200';

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {session?.retailer?.shopName ?? 'Unknown store'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Code: {entry.code} • Started {new Date(entry.startedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {entry.error ? entry.error.message : session ? `${session.items.length} items` : 'Loading...'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusColor}`}>
                    {status.toLowerCase()}
                  </span>
                  <Link
                    href={`/session/${entry.id}?code=${entry.code}`}
                    className="text-xs font-semibold text-[color:var(--green)] underline"
                  >
                    Open
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default OrdersPage;
