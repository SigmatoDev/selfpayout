'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import { apiClient } from '../../../../lib/api-client';

interface TicketOrderDetail {
  id: string;
  buyerName: string;
  buyerPhone: string;
  status: string;
  totalAmount: number;
  ticketsCount: number;
  event?: {
    title: string;
    venue: string;
  };
  items: Array<{
    id: string;
    label: string;
    price: number;
    quantity: number;
  }>;
}

interface ApiResource<T> {
  data: T;
}

const TicketOrderDetailPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const { data, isLoading } = useQuery({
    queryKey: ['ticketing-order', orderId],
    queryFn: () => apiClient.get<ApiResource<TicketOrderDetail>>(`admin/ticketing/orders/${orderId}`)
  });

  const order = data?.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Ticket order {orderId?.slice(0, 8)}</h1>
        <p className="text-sm text-slate-600">Review buyer info and ticket tiers.</p>
      </header>

      {isLoading && <p className="text-sm text-slate-500">Loading order…</p>}
      {!isLoading && !order && <p className="text-sm text-slate-500">Order not found.</p>}

      {order && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Buyer</h2>
            <p className="mt-2 text-sm text-slate-600">{order.buyerPhone}</p>
            <p className="text-sm text-slate-600">{order.buyerName}</p>
            <p className="mt-3 text-sm text-slate-600">Status: {order.status}</p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Event</h2>
            <p className="mt-2 text-sm text-slate-600">{order.event?.title ?? '-'}</p>
            <p className="text-sm text-slate-600">{order.event?.venue ?? '-'}</p>
            <p className="mt-3 text-sm text-slate-600">Tickets: {order.ticketsCount}</p>
            <p className="text-sm text-slate-600">Amount: ₹{order.totalAmount.toFixed(0)}</p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">Ticket tiers</h2>
            <div className="mt-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
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

export default TicketOrderDetailPage;
