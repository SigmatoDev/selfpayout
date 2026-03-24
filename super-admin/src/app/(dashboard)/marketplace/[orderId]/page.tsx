'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import { apiClient } from '../../../../lib/api-client';

interface MarketplaceOrderDetail {
  id: string;
  buyerPhone: string;
  buyerName: string;
  status: string;
  totalAmount: number;
  deliveryAddress?: string | null;
  retailer?: { shopName: string };
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}

interface ApiResource<T> {
  data: T;
}

const MarketplaceOrderDetailPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;

  const detailQuery = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => apiClient.get<ApiResource<MarketplaceOrderDetail>>(`admin/marketplace/orders/${orderId}`)
  });
  const order = detailQuery.data?.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link href="/marketplace" className="text-xs text-[color:var(--primary)] underline-offset-4 hover:underline">
          ← Back to marketplace orders
        </Link>
        <h1 className="text-2xl font-semibold">Order {orderId?.slice(0, 8)}</h1>
        <p className="text-sm text-slate-600">Marketplace order detail.</p>
      </header>

      {detailQuery.isLoading && (
        <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading order…
        </div>
      )}
      {!detailQuery.isLoading && !order && (
        <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 text-sm text-slate-500 shadow-sm">
          Order not found.
        </div>
      )}

      {order && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Buyer</h2>
            <p className="mt-2 text-sm text-slate-600">{order.buyerPhone}</p>
            <p className="text-sm text-slate-600">{order.buyerName}</p>
            <p className="mt-3 text-sm text-slate-600">
              Status: <span className="font-medium text-slate-900">{order.status}</span>
            </p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Retailer</h2>
            <p className="mt-2 text-sm text-slate-600">{order.retailer?.shopName ?? '-'}</p>
            <p className="text-sm text-slate-600">Amount: ₹{order.totalAmount.toFixed(0)}</p>
            <p className="text-sm text-slate-600">Delivery: {order.deliveryAddress ?? '-'}</p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">Items</h2>
            <div className="mt-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">₹{(item.price * item.quantity).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceOrderDetailPage;
