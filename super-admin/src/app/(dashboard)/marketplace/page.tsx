'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { queryKeys } from '../../../lib/query-keys';

interface MarketplaceOrder {
  id: string;
  buyerPhone: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  retailer?: { shopName: string };
}

interface CounterOrder {
  id: string;
  customerPhone?: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  retailer?: { shopName: string };
}

interface ApiResource<T> {
  data: T;
}

const MarketplacePage = () => {
  const marketplaceQuery = useQuery({
    queryKey: queryKeys.marketplaceOrders,
    queryFn: () => apiClient.get<ApiResource<MarketplaceOrder[]>>('admin/marketplace/orders')
  });
  const counterQuery = useQuery({
    queryKey: queryKeys.counterOrders,
    queryFn: () => apiClient.get<ApiResource<CounterOrder[]>>('admin/counter/orders')
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Marketplace Orders</h1>
        <p className="text-sm text-slate-600">Monitor online and counter order volume across retailers.</p>
      </header>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Online marketplace orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Retailer</th>
                <th className="px-3 py-2">Buyer</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketplaceQuery.data?.data.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <a className="text-[color:var(--primary)] hover:underline" href={`/marketplace/${order.id}`}>
                      {order.id.slice(0, 8)}
                    </a>
                  </td>
                  <td className="px-3 py-2">{order.retailer?.shopName ?? '-'}</td>
                  <td className="px-3 py-2">{order.buyerPhone}</td>
                  <td className="px-3 py-2">₹{order.totalAmount.toFixed(0)}</td>
                  <td className="px-3 py-2 capitalize">{order.status.toLowerCase()}</td>
                </tr>
              ))}
              {!marketplaceQuery.isLoading && marketplaceQuery.data?.data.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={5}>
                    No marketplace orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {marketplaceQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading marketplace orders…</p>}
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Counter orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Retailer</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {counterQuery.data?.data.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <a className="text-[color:var(--primary)] hover:underline" href={`/marketplace/${order.id}`}>
                      {order.id.slice(0, 8)}
                    </a>
                  </td>
                  <td className="px-3 py-2">{order.retailer?.shopName ?? '-'}</td>
                  <td className="px-3 py-2">{order.customerPhone ?? '-'}</td>
                  <td className="px-3 py-2">₹{order.totalAmount.toFixed(0)}</td>
                  <td className="px-3 py-2 capitalize">{order.status.toLowerCase()}</td>
                </tr>
              ))}
              {!counterQuery.isLoading && counterQuery.data?.data.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={5}>
                    No counter orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {counterQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading counter orders…</p>}
        </div>
      </section>
    </div>
  );
};

export default MarketplacePage;
