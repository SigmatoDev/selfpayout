'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { enqueueOfflineInvoice, getOfflineInvoices, InvoiceItemPayload } from '@/lib/offline';
import { queryKeys } from '@/lib/query-keys';
import { useLanguage } from '@/lib/language';

type PaymentMode = 'CASH' | 'UPI' | 'CARD';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  taxPercentage: number;
  stockQuantity: number;
}

interface ApiCollection<T> {
  data: T;
}

interface InvoiceResponse {
  data: {
    invoice: {
      id: string;
      totalAmount: number;
    };
  };
}

interface CreateInvoicePayload {
  paymentMode: PaymentMode;
  customerPhone?: string;
  items: InvoiceItemPayload[];
}

type CartItem = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  taxPercentage: number;
};

const BillingPage = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [lastInvoice, setLastInvoice] = useState<{ id: string; total: number } | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: queryKeys.inventory,
    queryFn: () => apiClient.get<ApiCollection<InventoryItem[]>>('inventory')
  });

  const createInvoiceMutation = useMutation<InvoiceResponse, Error, CreateInvoicePayload>({
    mutationFn: (payload) => apiClient.post<InvoiceResponse>('receipts', payload),
    onSuccess: (response) => {
      setCart([]);
      setCustomerPhone('');
      setLastInvoice({ id: response.data.invoice.id, total: response.data.invoice.totalAmount });
      setStatusMessage('Payment captured successfully. Receipt ready.');
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
    },
    onError: (error) => {
      setStatusMessage(error.message);
    }
  });

  const inventory = inventoryResponse?.data ?? [];

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory.slice(0, 8);
    const term = searchTerm.toLowerCase();
    return inventory
      .filter((item) => item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term))
      .slice(0, 8);
  }, [inventory, searchTerm]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = cart.reduce((acc, item) => acc + (item.price * item.quantity * item.taxPercentage) / 100, 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [cart]);

  const addToCart = (item: InventoryItem) => {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.sku === item.sku);
      if (existing) {
        return current.map((cartItem) =>
          cartItem.sku === item.sku
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [
        ...current,
        { sku: item.sku, name: item.name, price: item.price, quantity: 1, taxPercentage: item.taxPercentage }
      ];
    });
    setSearchTerm('');
  };

  const adjustQuantity = (sku: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.sku === sku
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updatePrice = (sku: string, price: number) => {
    setCart((current) =>
      current.map((item) =>
        item.sku === sku
          ? { ...item, price }
          : item
      )
    );
  };

  const handleCollectPayment = async () => {
    if (cart.length === 0) return;

    const payload: CreateInvoicePayload = {
      paymentMode,
      customerPhone: customerPhone || undefined,
      items: cart.map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        taxPercentage: item.taxPercentage
      }))
    };

    try {
      await createInvoiceMutation.mutateAsync(payload);
    } catch (error) {
      enqueueOfflineInvoice({
        retailerId: 'self',
        paymentMode,
        customerPhone: customerPhone || undefined,
        items: payload.items
      });
      setLastInvoice(null);
      setStatusMessage('Offline: invoice stored locally and will sync automatically.');
    }
  };

  const offlineCount = getOfflineInvoices().length;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: 'Create order',
            desc: 'Bill a new walk-in customer.',
            href: '/',
            emoji: '🧾'
          },
          {
            title: 'View orders',
            desc: 'See self-checkout sessions and tickets.',
            href: '/self-checkout',
            emoji: '🛒'
          },
          {
            title: 'View bills',
            desc: 'Review recent invoices and payments.',
            href: '/payments',
            emoji: '📂'
          }
        ].map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="surface-card flex flex-col gap-1 rounded-2xl border border-slate-200/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{card.emoji}</span>
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Shortcut</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{card.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{card.desc}</p>
          </a>
        ))}
      </section>

      <section className="surface-card rounded-2xl p-4 shadow-lg dark:shadow-xl">
        <div className="surface-muted flex items-center gap-3 rounded-xl px-3 py-2">
          <span role="img" aria-label="barcode">
            🧾
          </span>
          <input
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
            placeholder="Scan barcode or search item"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {filteredInventory.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {filteredInventory.map((item) => (
              <button
                key={item.sku}
                className="surface-muted rounded-xl px-2 py-3 text-left transition hover:shadow-md"
                onClick={() => addToCart(item)}
                disabled={isLoading}
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">₹{item.price}</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {cart.map((item) => (
            <div key={item.sku} className="surface-muted flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">₹{item.price.toFixed(2)} × {item.quantity}</p>
              </div>
              <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="input-surface w-24 rounded-md px-2 py-1 text-xs focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                  value={item.price}
                  onChange={(event) => updatePrice(item.sku, Number(event.target.value) || 0)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="size-7 rounded-full bg-slate-200 text-sm text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                    onClick={() => adjustQuantity(item.sku, -1)}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm text-slate-900 dark:text-white">{item.quantity}</span>
                  <button
                    className="size-7 rounded-full bg-[color:var(--brand-green)] text-sm text-white transition hover:opacity-90"
                    onClick={() => adjustQuantity(item.sku, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Add items from the quick pick grid to build a cart.</p>
          ) : null}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-4 shadow-lg dark:shadow-xl">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Customer phone
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className="input-surface rounded-lg px-3 py-2 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="Optional"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Payment mode
            <select
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value as PaymentMode)}
              className="input-surface rounded-lg px-3 py-2 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </label>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-4 shadow-lg text-sm dark:shadow-xl">
        <div className="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Subtotal</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">₹{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-slate-700 dark:text-slate-300">
          <span>Tax</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">₹{totals.tax.toFixed(2)}</span>
        </div>
        <div className="mt-3 flex justify-between text-lg font-semibold text-slate-900 dark:text-slate-50">
          <span>Total</span>
          <span>₹{totals.total.toFixed(2)}</span>
        </div>
        <button
          className="brand-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          onClick={handleCollectPayment}
          disabled={createInvoiceMutation.isPending || cart.length === 0}
        >
          {createInvoiceMutation.isPending ? 'Processing...' : t('collect_payment')}
        </button>

        {statusMessage ? <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{statusMessage}</p> : null}

        {lastInvoice ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-500 dark:text-slate-200 dark:hover:border-slate-300 dark:hover:text-white"
              type="button"
              onClick={() => window.print()}
            >
              Print receipt
            </button>
            {canShare ? (
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-500 dark:text-slate-200 dark:hover:border-slate-300 dark:hover:text-white"
                type="button"
                onClick={() =>
                  navigator
                    .share({
                      title: 'Receipt',
                      text: `Total ₹${lastInvoice.total.toFixed(2)}`,
                      url: window.location.href
                    })
                    .catch(() => {})
                }
              >
                Share
              </button>
            ) : null}
          </div>
        ) : null}

        {offlineCount > 0 ? (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
            {offlineCount} offline {t('offline_pending')}.
          </p>
        ) : null}
      </section>
    </div>
  );
};

export default BillingPage;
