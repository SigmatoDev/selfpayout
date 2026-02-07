'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { queryKeys } from '../../../lib/query-keys';

interface TicketEvent {
  id: string;
  title: string;
  venue: string;
  dateLabel: string;
  price: number;
  status: string;
  ticketsLeft: number;
  sellerName: string;
}

interface TicketOrder {
  id: string;
  buyerName: string;
  buyerPhone: string;
  status: string;
  totalAmount: number;
  ticketsCount: number;
  event?: {
    title: string;
  };
}

interface ApiResource<T> {
  data: T;
}

const TicketingPage = () => {
  const eventsQuery = useQuery({
    queryKey: queryKeys.ticketingEvents,
    queryFn: () => apiClient.get<ApiResource<TicketEvent[]>>('admin/ticketing/events')
  });
  const ordersQuery = useQuery({
    queryKey: queryKeys.ticketingOrders,
    queryFn: () => apiClient.get<ApiResource<TicketOrder[]>>('admin/ticketing/orders')
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Ticketing</h1>
        <p className="text-sm text-slate-600">Track active events and recent ticket orders.</p>
      </header>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Events</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Venue</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Tickets Left</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventsQuery.data?.data.map((event) => (
                <tr key={event.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{event.title}</td>
                  <td className="px-3 py-2">{event.venue}</td>
                  <td className="px-3 py-2">{event.dateLabel}</td>
                  <td className="px-3 py-2">₹{event.price.toFixed(0)}</td>
                  <td className="px-3 py-2">{event.ticketsLeft}</td>
                  <td className="px-3 py-2 capitalize">{event.status.toLowerCase()}</td>
                </tr>
              ))}
              {!eventsQuery.isLoading && eventsQuery.data?.data.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>
                    No events created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {eventsQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading events…</p>}
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Ticket orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Buyer</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Tickets</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordersQuery.data?.data.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <a className="text-[color:var(--primary)] hover:underline" href={`/ticketing/${order.id}`}>
                      {order.id.slice(0, 8)}
                    </a>
                  </td>
                  <td className="px-3 py-2">{order.buyerPhone}</td>
                  <td className="px-3 py-2">{order.event?.title ?? '-'}</td>
                  <td className="px-3 py-2">{order.ticketsCount}</td>
                  <td className="px-3 py-2">₹{order.totalAmount.toFixed(0)}</td>
                  <td className="px-3 py-2 capitalize">{order.status.toLowerCase()}</td>
                </tr>
              ))}
              {!ordersQuery.isLoading && ordersQuery.data?.data.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>
                    No ticket orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {ordersQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading orders…</p>}
        </div>
      </section>
    </div>
  );
};

export default TicketingPage;
