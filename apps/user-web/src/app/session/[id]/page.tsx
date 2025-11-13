'use client';

import Image from 'next/image';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ApiResource, CheckoutSession } from '@/lib/types';
import { storeTypeLabels as sharedStoreTypeLabels } from '@/lib/store-types';
import ThemeToggle from '@/components/theme-toggle';

interface ItemFormState {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  taxPercentage: number;
}

const emptyItem = (): ItemFormState => ({ sku: '', name: '', price: 0, quantity: 1, taxPercentage: 0 });

const fallbackStoreTypeLabels: Record<'KIRANA' | 'RESTAURANT' | 'TRAIN', string> = {
  KIRANA: 'Kirana store',
  RESTAURANT: 'Restaurant',
  TRAIN: 'Train booking'
};

const resolvedStoreTypeLabels: Record<'KIRANA' | 'RESTAURANT' | 'TRAIN', string> =
  sharedStoreTypeLabels ?? fallbackStoreTypeLabels;

const SessionPage = () => {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItem());
  const [message, setMessage] = useState<string | null>(null);
  const securityCode = search?.get('code');

  const sessionId = params?.id ?? '';

  const { data, isLoading, isFetching, refetch } = useQuery<ApiResource<CheckoutSession>>({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => apiClient.get<ApiResource<CheckoutSession>>(`self-checkout/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
    refetchInterval: (response) => {
      const status = response?.data?.status;
      if (!status) return false;
      return ['SUBMITTED', 'PAID'].includes(status) ? 5000 : false;
    }
  });

  const session = data?.data;

  const addItemMutation = useMutation<ApiResource<CheckoutSession>, Error, ItemFormState>({
    mutationFn: (payload) =>
      apiClient.post<ApiResource<CheckoutSession>>(`self-checkout/sessions/${sessionId}/items`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
      setItemForm(emptyItem());
      setMessage(null);
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });

  const submitMutation = useMutation<ApiResource<CheckoutSession>, Error>({
    mutationFn: () => apiClient.post<ApiResource<CheckoutSession>>(`self-checkout/sessions/${sessionId}/submit`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
      setMessage('Bill submitted. Please scan the store QR to pay and wait for staff to confirm.');
      router.push(`/session/${sessionId}?code=${response.data.securityCode}`);
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });

  const removeItemMutation = useMutation<ApiResource<CheckoutSession>, Error, string>({
    mutationFn: (itemId) =>
      apiClient.delete<ApiResource<CheckoutSession>>(`self-checkout/sessions/${sessionId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
      setMessage(null);
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });

  const totals = useMemo(() => {
    if (!session) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = session.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = session.items.reduce((acc, item) => acc + (item.price * item.quantity * item.taxPercentage) / 100, 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [session]);

  const displayCode = session?.securityCode ?? securityCode ?? '------';
  const canEdit = session?.status === 'IN_PROGRESS';
  const storeLabel = session?.storeType ? resolvedStoreTypeLabels[session.storeType] : undefined;
  const contextEntries = session?.context && typeof session.context === 'object'
    ? Object.entries(session.context as Record<string, unknown>)
    : [];

  const statusNotice = (() => {
    switch (session?.status) {
      case 'IN_PROGRESS':
        if (session?.storeType === 'RESTAURANT') {
          return 'Browse the menu, add dishes, and submit when you are ready to request the bill.';
        }
        if (session?.storeType === 'TRAIN') {
          return 'Add seats or services, then submit to generate a payment QR for the kiosk.';
        }
        return 'Scan items, review totals, and submit when you are ready to pay.';
      case 'SUBMITTED':
        if (session?.storeType === 'RESTAURANT') {
          return 'Please scan the table QR to pay. Staff will confirm your bill shortly.';
        }
        if (session?.storeType === 'TRAIN') {
          return 'Pay at the counter QR and wait for the attendant to confirm your booking.';
        }
        return 'Please scan the store UPI QR to pay. A staff member will mark the payment and this page will refresh automatically.';
      case 'PAID':
        return 'Payment confirmed. Present the QR code below at the exit for a quick security check.';
      case 'APPROVED':
        return 'Gate cleared! Thank you for using self checkout.';
      case 'CANCELLED':
        return 'This session has been cancelled. Please start a new one if needed.';
      default:
        return null;
    }
  })();

  const handleAddItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    setMessage(null);
    addItemMutation.mutate(itemForm);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!canEdit) return;
    setMessage(null);
    removeItemMutation.mutate(itemId);
  };

  const handleSubmit = () => {
    if (!canEdit) return;
    setMessage(null);
    submitMutation.mutate();
  };

  if (!sessionId) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/brand-logo.svg" alt="Selfcheckout" width={40} height={40} className="h-10 w-10" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Selfcheckout Express</span>
        </div>
        <ThemeToggle />
      </div>

      <section className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-400">Self scan session</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{session?.retailer?.shopName ?? 'Loading...'}</h1>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              session?.status === 'APPROVED'
                ? 'bg-green-200/10 text-green-300'
                : session?.status === 'PAID'
                  ? 'bg-blue-200/10 text-blue-300'
                  : 'bg-amber-200/10 text-amber-300'
            }`}
          >
            {session?.status ?? 'loading'}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="rounded-full border border-slate-400 px-3 py-1 text-slate-600 transition hover:border-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
          >
            Refresh
          </button>
        </div>

        {storeLabel ? (
          <p className="text-xs text-slate-600 dark:text-slate-300">Experience: {storeLabel}</p>
        ) : null}

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Security code:{' '}
          <span className="font-mono text-lg text-[color:var(--green)]">{displayCode}</span>
        </p>

        {statusNotice ? <p className="text-xs text-slate-500 dark:text-slate-400">{statusNotice}</p> : null}
      </section>

      {canEdit && (
        <form className="space-y-3 rounded-2xl surface-card p-4 text-sm shadow-lg" onSubmit={handleAddItem}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
              SKU / Barcode
              <input
                required
                value={itemForm.sku}
                onChange={(event) => setItemForm((prev) => ({ ...prev, sku: event.target.value }))}
                className="surface-input rounded-lg px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
              Name
              <input
                required
                value={itemForm.name}
                onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                className="surface-input rounded-lg px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
              Price (₹)
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={itemForm.price}
                onChange={(event) => setItemForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                className="surface-input rounded-lg px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
              Quantity
              <input
                type="number"
                min="1"
                step="1"
                required
                value={itemForm.quantity}
                onChange={(event) => setItemForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                className="surface-input rounded-lg px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
              Tax %
              <input
                type="number"
                min="0"
                max="28"
                step="1"
                value={itemForm.taxPercentage}
                onChange={(event) => setItemForm((prev) => ({ ...prev, taxPercentage: Number(event.target.value) }))}
                className="surface-input rounded-lg px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={addItemMutation.isPending}
            className="brand-gradient w-full rounded-xl py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {addItemMutation.isPending ? 'Adding...' : 'Add item'}
          </button>
        </form>
      )}

      <section className="space-y-3 rounded-2xl surface-card p-4 shadow-lg">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Cart</h2>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading session...</p>
        ) : session?.items.length ? (
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {session.items.map((item) => {
              const isRemoving = removeItemMutation.isPending && removeItemMutation.variables === item.id;
              return (
                <li key={item.id} className="surface-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantity} × ₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving}
                        className="rounded-full border border-rose-200 px-2 py-1 text-[11px] uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
                      >
                        {isRemoving ? 'Removing...' : 'Remove'}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">Scan items to build your bill.</p>
        )}

        <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>₹{totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-slate-900 dark:text-white">
            <span>Total</span>
            <span>₹{totals.total.toFixed(2)}</span>
          </div>
          {session?.invoice ? (
            <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
              Invoice #{session.invoice.id.slice(0, 8)} • paid via {session.invoice.paymentMode}
            </p>
          ) : null}
          {contextEntries.length > 0 ? (
            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
              <p className="mb-1 text-slate-700 dark:text-slate-300">Session details:</p>
              <ul className="space-y-1">
                {contextEntries.map(([key, value]) => (
                  <li key={key} className="surface-muted rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200">
                    {key}: <span className="text-slate-900 dark:text-slate-100">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !session || session.items.length === 0}
            className="brand-gradient mt-3 w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit bill'}
          </button>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl surface-card p-4 text-sm shadow-lg">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Gate check</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Staff will update your status once payment is verified. When it is marked paid, a gate-pass QR will appear below.
        </p>
        <div className="surface-muted rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center font-mono text-2xl tracking-widest text-[color:var(--brand-green)] dark:border-white/30">
          {displayCode}
        </div>
        {(session?.status === 'PAID' || session?.status === 'APPROVED') && session?.securityCode ? (
          <div className="surface-muted flex flex-col items-center gap-2 rounded-xl px-4 py-4">
            <QRCodeSVG value={`SELFCHK|${session.id}|${session.securityCode}`} size={160} fgColor="#38ef7d" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Ask security to scan this code alongside your cart.</p>
          </div>
        ) : null}
      </section>

      {message ? <p className="text-center text-xs text-red-500 dark:text-red-300">{message}</p> : null}
    </main>
  );
};

export default SessionPage;
