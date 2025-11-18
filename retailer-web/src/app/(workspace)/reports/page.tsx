'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { clearOfflineInvoices, getOfflineInvoices, removeOfflineInvoice } from '@/lib/offline';
import { queryKeys } from '@/lib/query-keys';

interface SalesSummary {
  total: number;
  tax: number;
  byPaymentMode: Record<string, number>;
}

interface LedgerEntry {
  id: string;
  name: string;
  phone: string;
  balanceAmount: number;
}

interface ApiCollection<T> {
  data: T;
}

const ReportsPage = () => {
  const queryClient = useQueryClient();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { data: summaryData } = useQuery({
    queryKey: queryKeys.salesSummary,
    queryFn: () => apiClient.get<ApiCollection<SalesSummary>>('sales/summary')
  });

  const { data: ledgerData } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => apiClient.get<ApiCollection<LedgerEntry[]>>('sales/ledger')
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const queued = getOfflineInvoices();
      if (queued.length === 0) {
        setSyncMessage('No offline invoices to sync.');
        return;
      }

      for (const entry of queued) {
        await apiClient.post('receipts', entry.payload);
        removeOfflineInvoice(entry.id);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      setSyncMessage('Offline invoices synced successfully.');
    },
    onError: (error) => {
      setSyncMessage(error instanceof Error ? error.message : 'Sync failed.');
    }
  });

  const summary = summaryData?.data;
  const ledger = ledgerData?.data ?? [];
  const offlineCount = getOfflineInvoices().length;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Daily snapshot</h2>
        <p className="text-sm text-slate-300">Sales, payment modes, and offline sync status.</p>
      </header>

      <section className="rounded-2xl bg-white/10 p-4 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-200">Today</h3>
        {summary ? (() => {
          const paymentEntries = Object.entries(summary.byPaymentMode) as Array<[string, number]>;
          return (
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <dt>Gross sales</dt>
                <dd className="text-lg font-semibold text-white">₹{summary.total.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Tax collected</dt>
                <dd className="text-lg font-semibold text-white">₹{summary.tax.toFixed(2)}</dd>
              </div>
              {paymentEntries.map(([mode, amount]) => (
                <div key={mode}>
                  <dt>{mode}</dt>
                  <dd className="text-lg font-semibold text-white">₹{amount.toFixed(2)}</dd>
                </div>
              ))}
            </dl>
          );
        })() : (
          <p className="mt-3 text-sm text-slate-400">No sales recorded yet today.</p>
        )}
      </section>

      <section className="rounded-2xl bg-white/10 p-4 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-200">Offline mode</h3>
        <p className="mt-2 text-xs text-slate-300">
          {offlineCount === 0 ? 'All invoices synced.' : `${offlineCount} bills waiting to sync`}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            className="flex-1 rounded-xl bg-[color:var(--blue)] py-3 text-sm font-semibold"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync now'}
          </button>
          <button
            className="flex-1 rounded-xl border border-slate-500 py-3 text-sm font-semibold text-slate-200"
            onClick={() => {
              clearOfflineInvoices();
              setSyncMessage('Offline queue cleared.');
            }}
          >
            Clear queue
          </button>
        </div>
        {syncMessage ? <p className="mt-2 text-xs text-slate-200">{syncMessage}</p> : null}
      </section>

      <section className="rounded-2xl bg-white/10 p-4 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-200">Outstanding ledger</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {ledger.length === 0 ? (
            <li className="rounded-lg bg-black/30 px-3 py-3 text-center text-slate-400">All dues settled.</li>
          ) : (
            ledger.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-3">
                <div>
                  <p className="font-medium text-white">{entry.name}</p>
                  <p className="text-xs text-slate-400">{entry.phone}</p>
                </div>
                <p className="text-sm font-semibold text-yellow-300">₹{entry.balanceAmount.toFixed(2)}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
};

export default ReportsPage;
