"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { getAuthToken } from '../../../lib/auth';
import { queryKeys } from '../../../lib/query-keys';

type RetailerStatus = 'PENDING_ONBOARDING' | 'ACTIVE' | 'SUSPENDED';

type StorageProvider = 'LOCAL' | 'S3';

type RetailerPlan = {
  id?: string;
  name?: string;
  price?: number;
  billingCycle?: string;
};

interface RetailerRecord {
  id: string;
  name: string;
  shopName: string;
  status: RetailerStatus;
  contactEmail: string;
  contactPhone: string;
  languagePreference?: 'en' | 'hi' | 'ka';
  storeType?: 'KIRANA' | 'RESTAURANT' | 'TRAIN';
  fssaiNumber?: string | null;
  serviceChargePct?: number | null;
  subscription?: {
    plan?: RetailerPlan | null;
  } | null;
  settings?: {
    storageProvider: StorageProvider;
    selfBillingEnabled?: boolean;
    marketplaceEnabled?: boolean;
    tableOrderingEnabled?: boolean;
    deliveryOrderingEnabled?: boolean;
    tokenOrderingEnabled?: boolean;
    ticketingEnabled?: boolean;
  } | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
}

interface ApiCollection<T> {
  data: T;
}

interface ApiResource<T> {
  data: T;
}

interface RetailerEnvelope {
  retailer: RetailerRecord;
  temporaryPassword?: string;
}

interface AssignPlanPayload {
  retailerId: string;
  planId: string;
}

const generatePassword = () => {
  const array = new Uint8Array(9);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.floor(Math.random() * 255);
    }
  }
  return Array.from(array)
    .map((value) => (value % 36).toString(36))
    .join('')
    .slice(0, 12);
};

const RetailersPage = () => {
  const queryClient = useQueryClient();
  const [assignRetailerId, setAssignRetailerId] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ retailerId: string; retailerName: string } | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordRequestSource, setPasswordRequestSource] = useState<'auto' | 'custom' | null>(null);

  useEffect(() => {
    setHasToken(Boolean(getAuthToken()));
  }, []);

  const { data: retailersResponse, isLoading: isRetailerLoading } = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiCollection<RetailerRecord[]>>('retailers'),
    enabled: hasToken
  });

  const { data: plansResponse } = useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => apiClient.get<ApiCollection<SubscriptionPlan[]>>('subscriptions/plans'),
    enabled: hasToken
  });

  const assignPlanMutation = useMutation<ApiCollection<unknown>, Error, AssignPlanPayload>({
    mutationFn: (payload) => apiClient.post<ApiCollection<unknown>>('subscriptions/assign', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
      setAssignRetailerId(null);
    }
  });

  const toggleStatusMutation = useMutation<ApiCollection<RetailerRecord>, Error, { retailerId: string; action: 'enable' | 'disable' }>({
    mutationFn: ({ retailerId, action }) => apiClient.post<ApiCollection<RetailerRecord>>(`retailers/${retailerId}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
    }
  });

  const resetPasswordMutation = useMutation<ApiResource<RetailerEnvelope>, Error, { retailerId: string; password: string }>({
    mutationFn: ({ retailerId, password }) =>
      apiClient.patch<ApiResource<RetailerEnvelope>>(`retailers/${retailerId}`, {
        temporaryPassword: password
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
      if (response.data.temporaryPassword) {
        setSecret({ email: response.data.retailer.contactEmail, password: response.data.temporaryPassword });
      }
      if (passwordRequestSource === 'custom') {
        setPasswordModal(null);
        setCustomPassword('');
        setPasswordError(null);
      }
      setPasswordRequestSource(null);
    },
    onError: (error) => {
      if (passwordRequestSource === 'custom') {
        setPasswordError(error.message);
      }
      setPasswordRequestSource(null);
    }
  });

  const retailers = retailersResponse?.data ?? [];
  const plans = plansResponse?.data ?? [];

  const handleToggleStatus = (retailer: RetailerRecord) => {
    if (toggleStatusMutation.isPending) return;
    const action = retailer.status === 'SUSPENDED' ? 'enable' : 'disable';
    toggleStatusMutation.mutate({ retailerId: retailer.id, action });
  };

  const handleResetPassword = (retailerId: string) => {
    const password = generatePassword();
    setPasswordRequestSource('auto');
    resetPasswordMutation.mutate({ retailerId, password });
  };

  const handleCustomPasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordModal) return;
    const trimmed = customPassword.trim();
    if (trimmed.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    setPasswordError(null);
    setPasswordRequestSource('custom');
    resetPasswordMutation.mutate({ retailerId: passwordModal.retailerId, password: trimmed });
  };

  const activePlans = useMemo(
    () => plans.map((plan) => ({ ...plan, label: `${plan.name} • ₹${plan.price}/${plan.billingCycle.toLowerCase()}` })),
    [plans]
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Retailers</h1>
        <p className="text-sm text-slate-600">Onboard, review, and manage billing access.</p>
        {secret ? (
          <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Temporary credentials generated</p>
            <p className="mt-1">Email: <span className="font-mono">{secret.email}</span></p>
            <p>Password: <span className="font-mono">{secret.password}</span></p>
            <button className="mt-2 text-xs font-medium text-amber-700 underline" onClick={() => setSecret(null)}>
              Dismiss
            </button>
          </div>
        ) : null}
      </header>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium">All retailers</h2>
              <p className="text-xs text-slate-500">Connected shops across the platform</p>
            </div>
            <Link
              href="/retailers/new"
              className={`rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white ${
                plans.length === 0 ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              New retailer
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--border)] bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Create a subscription plan before onboarding retailers.
            </div>
          ) : null}

          <div className="overflow-hidden rounded-md border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Storage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)] bg-white">
                {isRetailerLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                      Loading retailers...
                    </td>
                  </tr>
                ) : retailers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                      No retailers yet. Start by onboarding your first shop.
                    </td>
                  </tr>
                ) : (
                  retailers.map((retailer) => {
                    const statusLabel = retailer.status.replace('_', ' ');
                    const planLabel = retailer.subscription?.plan?.name
                      ? `${retailer.subscription.plan.name}`
                      : 'No plan';
                    const storageLabel = retailer.settings?.storageProvider ?? 'LOCAL';
                    const featureLabels = [
                      retailer.settings?.selfBillingEnabled ? 'self billing' : null,
                      retailer.settings?.marketplaceEnabled ? 'marketplace' : null,
                      retailer.settings?.tableOrderingEnabled ? 'restaurant table ordering' : null,
                      retailer.settings?.deliveryOrderingEnabled ? 'restaurant delivery ordering' : null,
                      retailer.settings?.tokenOrderingEnabled ? 'restaurant token ordering' : null,
                      retailer.settings?.ticketingEnabled ? 'ticketing' : null
                    ].filter(Boolean);

                    return (
                      <tr key={retailer.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{retailer.shopName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex flex-col">
                            <span>{retailer.contactEmail}</span>
                            <span className="text-xs text-slate-500">{retailer.contactPhone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex flex-col gap-1">
                            <span>{planLabel}</span>
                            <span className="text-[11px] uppercase tracking-wide text-slate-500">
                              {retailer.storeType ?? 'N/A'} • {retailer.serviceChargePct ?? 0}% svc
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {featureLabels.length > 0 ? featureLabels.join(', ') : 'No customer features enabled'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{storageLabel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              retailer.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700'
                                : retailer.status === 'SUSPENDED'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-end gap-3">
                            <button
                              onClick={() => setAssignRetailerId(retailer.id)}
                              disabled={plans.length === 0 || assignPlanMutation.isPending}
                              className="text-xs font-medium text-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Assign plan
                            </button>
                            <a
                              href={`https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encodeURIComponent(
                                retailer.id
                              )}&chld=L|1`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
                            >
                              Open QR
                            </a>
                            <Link
                              href={`/retailers/${retailer.id}`}
                              className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
                            >
                              View detail
                            </Link>
                            <button
                              onClick={() => handleResetPassword(retailer.id)}
                              disabled={resetPasswordMutation.isPending}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reset login
                            </button>
                            <button
                              onClick={() => {
                                setCustomPassword('');
                                setPasswordError(null);
                                setPasswordModal({ retailerId: retailer.id, retailerName: retailer.shopName });
                              }}
                              disabled={resetPasswordMutation.isPending}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Custom password
                            </button>
                            <button
                              onClick={() => handleToggleStatus(retailer)}
                              disabled={toggleStatusMutation.isPending}
                              className={`text-xs font-semibold ${
                                retailer.status === 'SUSPENDED'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {retailer.status === 'SUSPENDED' ? 'Enable' : 'Disable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {assignRetailerId ? (
        <RetailerModal onClose={() => setAssignRetailerId(null)} title="Assign subscription">
          <AssignPlanForm
            plans={activePlans}
            isSubmitting={assignPlanMutation.isPending}
            onSubmit={(planId) => assignPlanMutation.mutate({ retailerId: assignRetailerId, planId })}
            error={assignPlanMutation.error?.message}
          />
        </RetailerModal>
      ) : null}

      {passwordModal ? (
        <RetailerModal
          onClose={() => {
            setPasswordModal(null);
            setCustomPassword('');
            setPasswordError(null);
          }}
          title={`Custom password • ${passwordModal.retailerName}`}
        >
          <form className="space-y-4" onSubmit={handleCustomPasswordSubmit}>
            <label className="text-sm font-medium text-slate-600">
              New password
              <input
                type="text"
                value={customPassword}
                minLength={8}
                onChange={(event) => setCustomPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                placeholder="Minimum 8 characters"
              />
            </label>
            <p className="text-xs text-slate-500">Share securely with the retailer admin once saved.</p>
            {passwordError ? <p className="text-sm text-red-500">{passwordError}</p> : null}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resetPasswordMutation.isPending ? 'Saving...' : 'Save password'}
            </button>
          </form>
        </RetailerModal>
      ) : null}
    </div>
  );
};

const RetailerModal = ({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-sm text-slate-500">
          Close
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

const AssignPlanForm = ({
  plans,
  onSubmit,
  isSubmitting,
  error
}: {
  plans: Array<SubscriptionPlan & { label: string }>;
  onSubmit: (planId: string) => void;
  isSubmitting: boolean;
  error?: string;
}) => {
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!planId) return;
    onSubmit(planId);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-600">
        Select plan
        <select
          value={planId}
          onChange={(event) => setPlanId(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.label}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Assigning...' : 'Assign plan'}
      </button>
    </form>
  );
};

export default RetailersPage;
