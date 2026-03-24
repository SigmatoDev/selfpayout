'use client';

import Link from 'next/link';
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

interface ApiResource<T> {
  data: T;
}

const MarketplacePage = () => {
  const marketplaceQuery = useQuery({
    queryKey: queryKeys.marketplaceOrders,
    queryFn: () => apiClient.get<ApiResource<MarketplaceOrder[]>>('admin/marketplace/orders')
  });
  const orders = marketplaceQuery.data?.data ?? [];
  const submittedCount = orders.filter((order) => order.status === 'SUBMITTED').length;
  const fulfilledCount = orders.filter((order) => order.status === 'DELIVERED').length;
  const totalVolume = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Marketplace Orders</h1>
        <p className="text-sm text-slate-600">Monitor online marketplace orders across retailers.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total orders" value={orders.length} loading={marketplaceQuery.isLoading} />
        <SummaryCard label="Submitted" value={submittedCount} loading={marketplaceQuery.isLoading} />
        <SummaryCard label="Delivered" value={fulfilledCount} loading={marketplaceQuery.isLoading} />
        <SummaryCard
          label="GMV"
          value={`₹${totalVolume.toLocaleString('en-IN')}`}
          loading={marketplaceQuery.isLoading}
        />
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Online marketplace orders</h2>
            <p className="text-xs text-slate-500">Orders placed by customers through the marketplace flow.</p>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Retailer</th>
                <th className="px-3 py-2">Buyer</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)] bg-white">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <Link className="text-[color:var(--primary)] hover:underline" href={`/marketplace/${order.id}`}>
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{order.retailer?.shopName ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700">{order.buyerPhone}</td>
                  <td className="px-3 py-2 text-slate-500">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">₹{order.totalAmount.toFixed(0)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
              {!marketplaceQuery.isLoading && orders.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-sm text-slate-500" colSpan={6}>
                    No marketplace orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {marketplaceQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading marketplace orders…</p>}
      </section>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  loading
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) => (
  <div className="rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-xl font-semibold text-slate-900">
      {loading ? <span className="text-slate-400">…</span> : value}
    </p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toUpperCase();
  const className =
    normalized === 'DELIVERED'
      ? 'bg-green-50 text-green-700'
      : normalized === 'CANCELLED'
        ? 'bg-red-50 text-red-600'
        : normalized === 'SUBMITTED'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-700';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {status.toLowerCase()}
    </span>
  );
};

export default MarketplacePage;
