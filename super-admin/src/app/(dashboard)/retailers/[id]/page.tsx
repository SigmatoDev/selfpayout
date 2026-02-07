"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../../lib/api-client';
import { queryKeys } from '../../../../lib/query-keys';

interface ApiCollection<T> {
  data: T;
}

type RetailerStatus = 'PENDING_ONBOARDING' | 'ACTIVE' | 'SUSPENDED';

interface RetailerRecord {
  id: string;
  name: string;
  shopName: string;
  status: RetailerStatus;
  contactEmail: string;
  contactPhone: string;
  languagePreference?: 'en' | 'hi' | 'ka';
  settings?: {
    storageProvider: 'LOCAL' | 'S3';
  } | null;
}

interface InvoiceItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  taxPercentage: number;
}

interface Invoice {
  id: string;
  totalAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
  notes?: string | null;
  items: InvoiceItem[];
}

const RetailerDetailPage = () => {
  const params = useParams<{ id: string }>();
  const retailerId = params?.id;

  const { data: retailersResponse } = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiCollection<RetailerRecord[]>>('retailers'),
    enabled: Boolean(retailerId)
  });

  const retailer = useMemo(
    () => retailersResponse?.data.find((r) => r.id === retailerId),
    [retailersResponse, retailerId]
  );

  const { data: invoicesResponse, isLoading: isInvoicesLoading, error: invoicesError } = useQuery({
    queryKey: retailerId ? queryKeys.invoices(retailerId) : ['invoices', 'missing'],
    queryFn: () => apiClient.get<ApiCollection<Invoice[]>>(`receipts?retailerId=${retailerId}`),
    enabled: Boolean(retailerId)
  });

  const invoices = invoicesResponse?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link href="/retailers" className="text-xs text-[color:var(--primary)] underline-offset-4 hover:underline">
          ← Back to retailers
        </Link>
        <h1 className="text-2xl font-semibold">{retailer?.shopName ?? 'Retailer details'}</h1>
        <p className="text-sm text-slate-600">Onboarding overview and payment history.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
          <p className="text-lg font-semibold capitalize text-slate-900">
            {retailer?.status?.toLowerCase().replace('_', ' ') ?? 'Unknown'}
          </p>
          <p className="text-sm text-slate-600">
            Contact: {retailer?.contactEmail ?? '—'} • {retailer?.contactPhone ?? '—'}
          </p>
        </div>
        <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Store settings</p>
          <p className="text-sm text-slate-700">
            Storage: {retailer?.settings?.storageProvider ?? 'LOCAL'} • Language:{' '}
            {retailer?.languagePreference ?? 'en'}
          </p>
          <p className="text-xs text-slate-500">
            Restaurant context (tables/menu) available via retailer workspace; payments listed below.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Invoices & payments</p>
            <p className="text-xs text-slate-500">Recent receipts for this retailer</p>
          </div>
        </div>
        {isInvoicesLoading ? <p className="text-sm text-slate-500">Loading invoices...</p> : null}
        {invoicesError ? (
          <p className="text-sm text-red-500">{(invoicesError as Error).message}</p>
        ) : null}
        {invoices.length === 0 && !isInvoicesLoading ? (
          <p className="text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Items</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)] bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-2 text-slate-700">
                      {new Date(invoice.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      ₹{invoice.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{invoice.paymentMode}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {invoice.items.slice(0, 2).map((item) => item.name).join(', ')}
                      {invoice.items.length > 2 ? ` +${invoice.items.length - 2}` : ''}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{invoice.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RetailerDetailPage;
