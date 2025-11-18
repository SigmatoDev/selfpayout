"use client";

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { getAuthToken } from '../../../lib/auth';
import { queryKeys } from '../../../lib/query-keys';

interface ApiCollection<T> {
  data: T;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  features: string[];
  active: boolean;
}

interface RetailerOption {
  id: string;
  shopName: string;
}

interface PlanFormState {
  name: string;
  price: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  features: string;
  active: boolean;
}

const emptyPlan = (): PlanFormState => ({
  name: '',
  price: 0,
  billingCycle: 'MONTHLY',
  features: '',
  active: true
});

const SubscriptionsPage = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignPlanId, setAssignPlanId] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAuthToken()));
  }, []);

  const { data: plansResponse, isLoading } = useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => apiClient.get<ApiCollection<SubscriptionPlan[]>>('subscriptions/plans'),
    enabled: hasToken
  });

  const { data: retailersResponse } = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiCollection<RetailerOption[]>>('retailers'),
    enabled: hasToken
  });

  const createPlanMutation = useMutation<ApiCollection<SubscriptionPlan>, Error, PlanFormState>({
    mutationFn: (payload: PlanFormState) =>
      apiClient.post<ApiCollection<SubscriptionPlan>>('subscriptions/plans', {
        ...payload,
        price: Number(payload.price),
        features: payload.features
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      setIsCreateOpen(false);
    }
  });

  const updatePlanMutation = useMutation<
    ApiCollection<SubscriptionPlan>,
    Error,
    { id: string; data: PlanFormState }
  >({
    mutationFn: (payload: { id: string; data: PlanFormState }) =>
      apiClient.put<ApiCollection<SubscriptionPlan>>(`subscriptions/plans/${payload.id}`, {
        ...payload.data,
        price: Number(payload.data.price),
        features: payload.data.features
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      setEditingPlan(null);
      setAssignPlanId(variables.id);
    }
  });

  const assignPlanMutation = useMutation<
    ApiCollection<unknown>,
    Error,
    { planId: string; retailerId: string }
  >({
    mutationFn: (payload: { planId: string; retailerId: string }) =>
      apiClient.post<ApiCollection<unknown>>('subscriptions/assign', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
      setAssignPlanId(null);
    }
  });

  const plans = plansResponse?.data ?? [];
  const retailers = retailersResponse?.data ?? [];

  const planForEdit = editingPlan
    ? {
        ...editingPlan,
        features: editingPlan.features.join('\n')
      }
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subscription plans</h1>
          <p className="text-sm text-slate-600">Set pricing and inclusions for retailers.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          New plan
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-500">
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-500">
            No plans yet. Create one to get started.
          </div>
        ) : (
          plans.map((plan) => (
            <article key={plan.id} className="flex h-full flex-col justify-between rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <span className="text-xs uppercase text-slate-500">{plan.billingCycle.toLowerCase()}</span>
                </div>
                <p className="text-2xl font-bold">₹{plan.price}</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {plan.features.length > 0 ? (
                    plan.features.map((feature) => <li key={feature}>• {feature}</li>)
                  ) : (
                    <li className="text-slate-400">No features listed</li>
                  )}
                </ul>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {plan.active ? 'Active' : 'Inactive'} plan
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="flex-1 rounded-md border border-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary)]"
                >
                  Edit plan
                </button>
                <button
                  onClick={() => setAssignPlanId(plan.id)}
                  className="flex-1 rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white"
                >
                  Assign to retailer
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {isCreateOpen ? (
        <PlanModal title="Create subscription plan" onClose={() => setIsCreateOpen(false)}>
          <PlanForm
            defaultValues={emptyPlan()}
            isSubmitting={createPlanMutation.isPending}
            onSubmit={(values) => createPlanMutation.mutate(values)}
            error={createPlanMutation.error?.message}
          />
        </PlanModal>
      ) : null}

      {planForEdit ? (
        <PlanModal title="Edit plan" onClose={() => setEditingPlan(null)}>
          <PlanForm
            defaultValues={{
              name: planForEdit.name,
              price: planForEdit.price,
              billingCycle: planForEdit.billingCycle,
              features: planForEdit.features,
              active: planForEdit.active
            }}
            isSubmitting={updatePlanMutation.isPending}
            onSubmit={(values) =>
              updatePlanMutation.mutate({ id: editingPlan!.id, data: values })
            }
            error={updatePlanMutation.error?.message}
          />
        </PlanModal>
      ) : null}

      {assignPlanId ? (
        <PlanModal title="Assign plan" onClose={() => setAssignPlanId(null)}>
          <AssignPlanToRetailerForm
            retailers={retailers}
            onSubmit={(retailerId) => assignPlanMutation.mutate({ planId: assignPlanId, retailerId })}
            isSubmitting={assignPlanMutation.isPending}
            error={assignPlanMutation.error?.message}
          />
        </PlanModal>
      ) : null}
    </div>
  );
};

const PlanModal = ({
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

const PlanForm = ({
  defaultValues,
  onSubmit,
  isSubmitting,
  error
}: {
  defaultValues: PlanFormState;
  onSubmit: (values: PlanFormState) => void;
  isSubmitting: boolean;
  error?: string;
}) => {
  const [formState, setFormState] = useState<PlanFormState>(defaultValues);

  const updateField = <K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formState);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-600">
        Plan name
        <input
          required
          value={formState.name}
          onChange={(event) => updateField('name', event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
        />
      </label>
      <label className="text-sm font-medium text-slate-600">
        Price (₹)
        <input
          required
          type="number"
          min={0}
          value={formState.price}
          onChange={(event) => updateField('price', Number(event.target.value))}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
        />
      </label>
      <label className="text-sm font-medium text-slate-600">
        Billing cycle
        <select
          value={formState.billingCycle}
          onChange={(event) =>
            updateField('billingCycle', event.target.value as PlanFormState['billingCycle'])
          }
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </label>
      <label className="text-sm font-medium text-slate-600">
        Included features (one per line)
        <textarea
          rows={4}
          value={formState.features}
          onChange={(event) => updateField('features', event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
        />
      </label>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <input
          id="plan-active"
          type="checkbox"
          checked={formState.active}
          onChange={(event) => updateField('active', event.target.checked)}
          className="size-4 rounded border-slate-300"
        />
        <label htmlFor="plan-active">Plan active</label>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Saving...' : 'Save plan'}
      </button>
    </form>
  );
};

const AssignPlanToRetailerForm = ({
  retailers,
  onSubmit,
  isSubmitting,
  error
}: {
  retailers: RetailerOption[];
  onSubmit: (retailerId: string) => void;
  isSubmitting: boolean;
  error?: string;
}) => {
  const [retailerId, setRetailerId] = useState(retailers[0]?.id ?? '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!retailerId) return;
    onSubmit(retailerId);
  };

  const options = useMemo(() => retailers, [retailers]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-600">
        Retailer
        <select
          value={retailerId}
          onChange={(event) => setRetailerId(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
        >
          {options.length === 0 ? (
            <option value="" disabled>
              No retailers available
            </option>
          ) : (
            options.map((retailer) => (
              <option key={retailer.id} value={retailer.id}>
                {retailer.shopName}
              </option>
            ))
          )}
        </select>
      </label>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting || options.length === 0}
        className="w-full rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Assigning...' : 'Assign plan'}
      </button>
    </form>
  );
};

export default SubscriptionsPage;
