'use client';

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

interface CounterOrderDetail {
  id: string;
  customerPhone?: string | null;
  status: string;
  totalAmount: number;
  retailer?: { shopName: string };
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}

interface ApiResource<T> {
  data: T;
}

type OrderDetailResult =
  | { kind: 'marketplace'; data: MarketplaceOrderDetail }
  | { kind: 'counter'; data: CounterOrderDetail };

const MarketplaceOrderDetailPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;

  const detailQuery = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResource<MarketplaceOrderDetail>>(`admin/marketplace/orders/${orderId}`);
        return { kind: 'marketplace', data: response.data } as OrderDetailResult;
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (!message.includes('not found')) {
          throw error;
        }
        const response = await apiClient.get<ApiResource<CounterOrderDetail>>(`admin/counter/orders/${orderId}`);
        return { kind: 'counter', data: response.data } as OrderDetailResult;
      }
    }
  });
  const order = detailQuery.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Order {orderId?.slice(0, 8)}</h1>
        <p className="text-sm text-slate-600">Marketplace or counter order detail.</p>
      </header>

      {detailQuery.isLoading && <p className="text-sm text-slate-500">Loading order…</p>}
      {!detailQuery.isLoading && !order && <p className="text-sm text-slate-500">Order not found.</p>}

      {order && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Buyer</h2>
            <p className="mt-2 text-sm text-slate-600">
              {order.kind === 'marketplace' ? order.data.buyerPhone : order.data.customerPhone ?? '-'}
            </p>
            <p className="text-sm text-slate-600">
              {order.kind === 'marketplace' ? order.data.buyerName : 'Counter customer'}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Status: {order.kind === 'marketplace' ? order.data.status : order.data.status}
            </p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Retailer</h2>
            <p className="mt-2 text-sm text-slate-600">
              {order.kind === 'marketplace' ? order.data.retailer?.shopName ?? '-' : order.data.retailer?.shopName ?? '-'}
            </p>
            <p className="text-sm text-slate-600">
              Amount: ₹
              {(order.kind === 'marketplace' ? order.data.totalAmount : order.data.totalAmount).toFixed(0)}
            </p>
            <p className="text-sm text-slate-600">
              Delivery:{' '}
              {order.kind === 'marketplace'
                ? order.data.deliveryAddress ?? '-'
                : 'Counter pickup'}
            </p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">Items</h2>
            <div className="mt-4 space-y-2">
              {(order.kind === 'marketplace' ? order.data.items : order.data.items).map((item) => (
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
