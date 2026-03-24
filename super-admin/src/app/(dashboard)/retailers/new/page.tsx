"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../../lib/api-client';
import { queryKeys } from '../../../../lib/query-keys';

type StoreType = 'KIRANA' | 'RESTAURANT' | 'TRAIN';
type Language = 'en' | 'hi' | 'ka';

interface ApiCollection<T> {
  data: T;
}

interface ApiResource<T> {
  data: T;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
}

interface RetailerRecord {
  id: string;
  shopName: string;
  contactEmail: string;
  storeType?: StoreType;
}

interface RetailerEnvelope {
  retailer: RetailerRecord;
  temporaryPassword?: string;
}

interface FormState {
  name: string;
  contactEmail: string;
  contactPhone: string;
  shopName: string;
  address: string;
  storeType: StoreType;
  fssaiNumber: string;
  serviceChargePct: number;
  gstEnabled: boolean;
  gstNumber: string;
  subscriptionPlanId: string;
  languagePreference: Language;
  temporaryPassword: string;
  aadharNumber: string;
  panNumber: string;
}

const storeTypes: Array<{ id: StoreType; label: string; description: string }> = [
  { id: 'RESTAURANT', label: 'Restaurant', description: 'Dining, table ordering, tokens, KOT, and menu setup' },
  { id: 'KIRANA', label: 'Kirana / marketplace', description: 'Inventory, self billing, and online product selling' },
  { id: 'TRAIN', label: 'Ticketing / events', description: 'Events, bookings, and ticket order management' }
];

const toBase64 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const contentTypeForFile = (file: File) => file.type || 'application/octet-stream';

const NewRetailerPage = () => {
  const queryClient = useQueryClient();
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [created, setCreated] = useState<RetailerEnvelope | null>(null);
  const [formState, setFormState] = useState<FormState>({
    name: '',
    contactEmail: '',
    contactPhone: '',
    shopName: '',
    address: '',
    storeType: 'RESTAURANT',
    fssaiNumber: '',
    serviceChargePct: 0,
    gstEnabled: false,
    gstNumber: '',
    subscriptionPlanId: '',
    languagePreference: 'en',
    temporaryPassword: '',
    aadharNumber: '',
    panNumber: ''
  });

  const plansQuery = useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => apiClient.get<ApiCollection<SubscriptionPlan[]>>('subscriptions/plans')
  });

  const activePlans = useMemo(
    () =>
      (plansQuery.data?.data ?? []).map((plan) => ({
        ...plan,
        label: `${plan.name} • ₹${plan.price}/${plan.billingCycle.toLowerCase()}`
      })),
    [plansQuery.data]
  );

  const createRetailerMutation = useMutation<ApiResource<RetailerEnvelope>, Error, void>({
    mutationFn: async () => {
      const documents =
        aadharFile || panFile
          ? {
              ...(aadharFile
                ? {
                    aadhar: {
                      fileName: aadharFile.name,
                      contentType: contentTypeForFile(aadharFile),
                      data: await toBase64(aadharFile)
                    }
                  }
                : {}),
              ...(panFile
                ? {
                    pan: {
                      fileName: panFile.name,
                      contentType: contentTypeForFile(panFile),
                      data: await toBase64(panFile)
                    }
                  }
                : {})
            }
          : undefined;

      return apiClient.post<ApiResource<RetailerEnvelope>>('retailers', {
        name: formState.name,
        contactEmail: formState.contactEmail,
        contactPhone: formState.contactPhone,
        shopName: formState.shopName,
        address: formState.address,
        storeType: formState.storeType,
        fssaiNumber: formState.fssaiNumber || undefined,
        serviceChargePct: Number(formState.serviceChargePct || 0),
        gstEnabled: formState.gstEnabled,
        gstNumber: formState.gstEnabled ? formState.gstNumber || undefined : undefined,
        subscriptionPlanId: formState.subscriptionPlanId,
        languagePreference: formState.languagePreference,
        temporaryPassword: formState.temporaryPassword || undefined,
        aadharNumber: formState.aadharNumber || undefined,
        panNumber: formState.panNumber || undefined,
        documents
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
      setCreated(response.data);
    }
  });

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link href="/retailers" className="text-xs text-[color:var(--primary)] underline-offset-4 hover:underline">
          ← Back to retailers
        </Link>
        <h1 className="text-2xl font-semibold">Retailer onboarding</h1>
        <p className="text-sm text-slate-600">
          Collect the full business profile first, then continue with category-specific setup after creation.
        </p>
      </header>

      {created ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-900">Retailer created successfully</p>
          <p className="mt-2 text-sm text-emerald-800">
            {created.retailer.shopName} has been added with admin login <span className="font-mono">{created.retailer.contactEmail}</span>.
          </p>
          {created.temporaryPassword ? (
            <p className="mt-1 text-sm text-emerald-800">
              Temporary password: <span className="font-mono">{created.temporaryPassword}</span>
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {created.retailer.storeType === 'RESTAURANT' ? (
              <Link
                href={`/retailers/${created.retailer.id}/restaurant-setup`}
                className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white"
              >
                Continue restaurant setup
              </Link>
            ) : null}
            <Link
              href={`/retailers/${created.retailer.id}`}
              className="rounded-md border border-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary)]"
            >
              View retailer
            </Link>
          </div>
        </section>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          createRetailerMutation.mutate();
        }}
      >
        <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="text-xs text-slate-500">Match the business profile captured in the retailer app onboarding flow.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Owner / contact name" required>
              <input
                required
                value={formState.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
            <Field label="Store / brand name" required>
              <input
                required
                value={formState.shopName}
                onChange={(event) => updateField('shopName', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
            <Field label="Contact email" required>
              <input
                required
                type="email"
                value={formState.contactEmail}
                onChange={(event) => updateField('contactEmail', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
            <Field label="Contact phone" required>
              <input
                required
                value={formState.contactPhone}
                onChange={(event) => updateField('contactPhone', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Business</h2>
            <p className="text-xs text-slate-500">Choose the operational category and billing defaults.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Store type" required>
              <select
                value={formState.storeType}
                onChange={(event) => updateField('storeType', event.target.value as StoreType)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              >
                {storeTypes.map((storeType) => (
                  <option key={storeType.id} value={storeType.id}>
                    {storeType.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {storeTypes.find((item) => item.id === formState.storeType)?.description}
              </p>
            </Field>
            <Field label="Preferred language" required>
              <select
                value={formState.languagePreference}
                onChange={(event) => updateField('languagePreference', event.target.value as Language)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ka">Kannada</option>
              </select>
            </Field>
            <Field label="Address" required>
              <textarea
                required
                rows={4}
                value={formState.address}
                onChange={(event) => updateField('address', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
            <div className="grid gap-4">
              <Field label="Subscription plan" required>
                <select
                  required
                  value={formState.subscriptionPlanId}
                  onChange={(event) => updateField('subscriptionPlanId', event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                >
                  <option value="">Select a plan</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="FSSAI number">
                <input
                  value={formState.fssaiNumber}
                  onChange={(event) => updateField('fssaiNumber', event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                />
              </Field>
              <Field label="Default service charge %">
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={formState.serviceChargePct}
                  onChange={(event) => updateField('serviceChargePct', Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                />
              </Field>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formState.gstEnabled}
                onChange={(event) => updateField('gstEnabled', event.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
              GST registered
            </label>
            <input
              value={formState.gstNumber}
              onChange={(event) => updateField('gstNumber', event.target.value)}
              disabled={!formState.gstEnabled}
              placeholder="GST number"
              className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none disabled:bg-slate-50"
            />
          </div>
        </section>

        <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Verification</h2>
            <p className="text-xs text-slate-500">Admin can upload the same KYC info captured in the retailer app.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Aadhaar number">
              <input
                value={formState.aadharNumber}
                onChange={(event) => updateField('aadharNumber', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
            <Field label="PAN number">
              <input
                value={formState.panNumber}
                onChange={(event) => updateField('panNumber', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
            </Field>
            <Field label="Aadhaar document">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setAadharFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
            </Field>
            <Field label="PAN document">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setPanFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Access</h2>
            <p className="text-xs text-slate-500">Set a password now or let the platform generate one.</p>
          </div>
          <Field label="Temporary password">
            <input
              value={formState.temporaryPassword}
              onChange={(event) => updateField('temporaryPassword', event.target.value)}
              placeholder="Leave blank to auto-generate"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
            />
          </Field>
        </section>

        {createRetailerMutation.error ? (
          <p className="text-sm text-red-500">{createRetailerMutation.error.message}</p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createRetailerMutation.isPending || plansQuery.isLoading}
            className="rounded-md bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createRetailerMutation.isPending ? 'Creating...' : 'Create retailer'}
          </button>
          <Link
            href="/retailers"
            className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

const Field = ({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="text-sm font-medium text-slate-600">
    {label} {required ? <span className="text-red-500">*</span> : null}
    {children}
  </label>
);

export default NewRetailerPage;
