'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

type SessionStatus = 'SUBMITTED' | 'PAID' | 'APPROVED';

interface CheckoutItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  taxPercentage: number;
}

interface CheckoutSession {
  id: string;
  retailerId: string;
  status: SessionStatus | 'IN_PROGRESS' | 'CANCELLED';
  customerPhone?: string | null;
  securityCode: string;
  totalAmount: number;
  createdAt: string;
  storeType: 'KIRANA' | 'RESTAURANT' | 'TRAIN';
  context?: Record<string, unknown> | null;
  items: CheckoutItem[];
  invoice?: {
    id: string;
    totalAmount: number;
    paymentMode: 'CASH' | 'UPI' | 'CARD';
    createdAt: string;
  } | null;
}

interface Invoice {
  id: string;
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  subtotalAmount: number;
  taxAmount: number;
  createdAt: string;
}

interface ApiCollection<T> {
  data: T;
}

const statusFilters: SessionStatus[] = ['SUBMITTED', 'PAID', 'APPROVED'];

const storeTypeLabels: Record<'KIRANA' | 'RESTAURANT' | 'TRAIN', string> = {
  KIRANA: 'Kirana store',
  RESTAURANT: 'Restaurant',
  TRAIN: 'Train booking'
};

const SelfCheckoutPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('SUBMITTED');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [queryKeys.selfCheckoutSessions, status],
    queryFn: () =>
      apiClient.get<ApiCollection<CheckoutSession[]>>(
        `self-checkout/sessions?status=${encodeURIComponent(status)}`
      )
  });

  const markPaymentMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post<ApiCollection<{ session: CheckoutSession; invoice: Invoice }>>(
        `self-checkout/sessions/${sessionId}/mark-payment`,
        { paymentMode: 'UPI' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.selfCheckoutSessions, status] });
    }
  });

  const verifyMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post<ApiCollection<CheckoutSession>>(
        `self-checkout/sessions/${sessionId}/verify`,
        { guardId: 'STORE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.selfCheckoutSessions, status] });
    }
  });

  const sessions = data?.data ?? [];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Self checkout queue</h2>
          <p className="text-xs text-slate-400">
            Confirm payments and hand off gate passes for phone-based checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md border border-slate-600 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
          disabled={isLoading || isRefetching}
        >
          Refresh
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatus(filter)}
            className={`rounded-full px-3 py-1 ${
              status === filter ? 'bg-[color:var(--green)] text-slate-900' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {filter.toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="rounded-2xl bg-white/10 px-4 py-6 text-center text-sm text-slate-300">
          Loading sessions...
        </p>
      ) : sessions.length === 0 ? (
        <p className="rounded-2xl bg-white/10 px-4 py-6 text-center text-sm text-slate-300">
          No sessions in this state.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isSubmitted = session.status === 'SUBMITTED';
            const isPaid = session.status === 'PAID';
            const contextEntries = session.context && typeof session.context === 'object'
              ? Object.entries(session.context as Record<string, unknown>)
              : [];
            const storeLabel = storeTypeLabels[session.storeType] ?? session.storeType.toLowerCase();

            return (
              <article key={session.id} className="space-y-3 rounded-2xl bg-white/10 p-4 shadow-lg text-sm">
                <header className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <span>
                    Session #{session.id.slice(0, 8)} • {new Date(session.createdAt).toLocaleTimeString()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      session.status === 'APPROVED'
                        ? 'bg-green-200/10 text-green-300'
                        : session.status === 'PAID'
                          ? 'bg-blue-200/10 text-blue-300'
                          : 'bg-amber-200/10 text-amber-300'
                    }`}
                  >
                    {session.status.toLowerCase()}
                  </span>
                </header>

                <div className="text-xs text-slate-300">
                  <p>
                    Store type: <span className="font-medium text-white">{storeLabel}</span>
                  </p>
                  {contextEntries.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      {contextEntries.map(([key, value]) => (
                        <li key={key} className="rounded-full bg-black/30 px-2 py-1">
                          {key}: <span className="text-slate-200">{String(value)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="rounded-xl bg-black/30 px-3 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total items: {session.items.length}</span>
                    <span>Security code: <strong className="font-mono text-slate-200">{session.securityCode}</strong></span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {session.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-slate-200">
                        <span>
                          {item.name}{' '}
                          <span className="text-xs text-slate-400">
                            ({item.quantity} × ₹{item.price.toFixed(2)})
                          </span>
                        </span>
                        <span className="text-xs text-slate-300">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {(session.status === 'PAID' || session.status === 'APPROVED') && (
                    <div className="mt-3 flex justify-center">
                      <div className="rounded-lg bg-black/40 px-3 py-3">
                        <QRCodeSVG value={`SELFCHK|${session.id}|${session.securityCode}`} size={90} fgColor="#38ef7d" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-300">
                    <p>
                      Total: <strong className="text-white">₹{session.totalAmount.toFixed(2)}</strong>
                    </p>
                    {session.invoice ? (
                      <p className="mt-1 text-slate-400">
                        Invoice #{session.invoice.id.slice(0, 8)} via {session.invoice.paymentMode}
                      </p>
                    ) : (
                      <p className="mt-1 text-slate-400">
                        Awaiting payment confirmation.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {isSubmitted ? (
                      <button
                        type="button"
                        onClick={() => markPaymentMutation.mutate(session.id)}
                        disabled={markPaymentMutation.isPending}
                        className="rounded-md bg-[color:var(--green)] px-3 py-2 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {markPaymentMutation.isPending ? 'Marking...' : 'Mark payment received'}
                      </button>
                    ) : null}

                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => verifyMutation.mutate(session.id)}
                        disabled={verifyMutation.isPending}
                        className="rounded-md border border-slate-500 px-3 py-2 font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {verifyMutation.isPending ? 'Clearing...' : 'Guard confirm'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelfCheckoutPage;
