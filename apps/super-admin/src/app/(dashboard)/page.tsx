'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-keys';

interface Metrics {
  totalRetailers: number;
  activeRetailers: number;
  suspendedRetailers: number;
  pendingKyc: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

interface ApiResource<T> {
  data: T;
}

const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.metrics,
    queryFn: () => apiClient.get<ApiResource<Metrics>>('admin/metrics')
  });

  const metrics = data?.data;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Morning, admin 👋</h1>
        <p className="text-slate-600">Keep an eye on onboarding health and subscription performance.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active retailers" value={metrics?.activeRetailers ?? 0} loading={isLoading} />
        <MetricCard label="Pending KYC" value={metrics?.pendingKyc ?? 0} loading={isLoading} />
        <MetricCard
          label="Monthly recurring revenue"
          value={metrics ? `₹${metrics.monthlyRecurringRevenue.toLocaleString('en-IN')}` : '₹0'}
          loading={isLoading}
        />
        <MetricCard label="Suspended" value={metrics?.suspendedRetailers ?? 0} loading={isLoading} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Onboarding actions</h2>
          <p className="mt-2 text-sm text-slate-600">Review KYC requests or activate new subscriptions.</p>
          <div className="mt-4 flex gap-3">
            <Link className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white" href="/kyc">
              Review KYC
            </Link>
            <Link
              className="rounded-md border border-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary)]"
              href="/retailers"
            >
              Manage retailers
            </Link>
          </div>
        </article>

        <article className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Revenue snapshot</h2>
          <p className="mt-2 text-sm text-slate-600">
            {metrics
              ? `${metrics.activeSubscriptions} active subscriptions contributing to ARR.`
              : 'Connect Razorpay to start collecting subscription payments.'}
          </p>
          <Link className="mt-4 inline-block text-sm font-medium text-[color:var(--primary)]" href="/subscriptions">
            Configure plans
          </Link>
        </article>
      </section>
    </div>
  );
};

const MetricCard = ({
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
    <p className="mt-2 text-xl font-semibold">
      {loading ? <span className="text-slate-400">…</span> : value}
    </p>
  </div>
);

export default DashboardPage;
