'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CurrentUserResponse, Invoice } from '@/lib/types';

interface ApiCollection<T> {
  data: T;
}

const PaymentsPage = () => {
  const { data: userData } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.get<CurrentUserResponse>('auth/me')
  });

  const retailerId = userData?.user?.retailerId;

  const { data, isLoading, error } = useQuery({
    queryKey: retailerId ? queryKeys.invoices(retailerId) : ['invoices', 'missing'],
    queryFn: () => apiClient.get<ApiCollection<Invoice[]>>(`receipts?retailerId=${retailerId}`),
    enabled: Boolean(retailerId)
  });

  if (!retailerId) {
    return <p className="text-sm text-slate-500">No retailer context found. Please re-login.</p>;
  }

  const invoices = data?.data ?? [];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Payments & receipts</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Track paid receipts and payment modes.</p>
      </header>

      {isLoading ? <p className="text-sm text-slate-500">Loading payments...</p> : null}
      {error ? <p className="text-sm text-rose-500">{(error as Error).message}</p> : null}

      {invoices.length ? (
        <ul className="space-y-3">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="rounded-xl border border-slate-200/70 bg-white/50 p-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    ₹{invoice.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(invoice.createdAt).toLocaleString()} • {invoice.paymentMode}
                  </p>
                </div>
                {invoice.notes ? <p className="text-xs text-slate-500">{invoice.notes}</p> : null}
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {invoice.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{item.quantity} × ₹{item.price.toFixed(2)}</span>
                  </div>
                ))}
                {invoice.items.length > 3 ? (
                  <p className="text-[11px] text-slate-500">+{invoice.items.length - 3} more items</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && <p className="text-sm text-slate-500">No payments recorded yet.</p>
      )}
    </div>
  );
};

export default PaymentsPage;
