'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiResource, CheckoutSession } from '@/lib/types';
import ThemeToggle from '@/components/theme-toggle';

type StoreType = 'KIRANA' | 'RESTAURANT' | 'TRAIN';

interface StartSessionPayload {
  retailerCode: string;
  customerPhone?: string;
  storeType: StoreType;
  context?: Record<string, string>;
}

const storeOptions: Array<{ id: StoreType; title: string; description: string; helper?: string }> = [
  {
    id: 'KIRANA',
    title: 'Kirana store',
    description: 'Scan groceries, daily essentials, or household goods and pay at the counter QR.',
    helper: 'Keep your receipt handy for store staff.'
  },
  {
    id: 'RESTAURANT',
    title: 'Restaurant / café',
    description: 'Scan menu items at the table and pay digitally before you leave.',
    helper: 'We’ll ask for your table number so staff can serve you faster.'
  },
  {
    id: 'TRAIN',
    title: 'Train booking kiosk',
    description: 'Reserve seats or add add-ons (meals, Wi-Fi) and show the QR at the gate.',
    helper: 'Have your train and seat details ready.'
  }
];

const HomePage = () => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<StoreType | null>(null);
  const [retailerCode, setRetailerCode] = useState('');
  const [phone, setPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [coach, setCoach] = useState('');
  const [seat, setSeat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const option = useMemo(() => storeOptions.find((item) => item.id === selectedType) ?? null, [selectedType]);

  const startSessionMutation = useMutation<ApiResource<CheckoutSession>, Error, StartSessionPayload>({
    mutationFn: (payload) => apiClient.post<ApiResource<CheckoutSession>>('self-checkout/sessions', payload),
    onSuccess: (response) => {
      const session = response.data;
      router.push(`/session/${session.id}?code=${session.securityCode}`);
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedType) return;
    setError(null);

    const context: Record<string, string> = {};
    if (selectedType === 'RESTAURANT') {
      if (tableNumber) context.tableNumber = tableNumber;
      if (guestCount) context.guestCount = guestCount;
    }
    if (selectedType === 'TRAIN') {
      if (!trainNumber) {
        setError('Please enter the train number.');
        return;
      }
      if (trainNumber) context.trainNumber = trainNumber;
      if (coach) context.coach = coach;
      if (seat) context.seat = seat;
    }

    try {
      await startSessionMutation.mutateAsync({
        retailerCode,
        customerPhone: phone || undefined,
        storeType: selectedType,
        context: Object.keys(context).length > 0 ? context : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start session');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-10 text-slate-900 dark:text-slate-100">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/brand-logo.svg" alt="Selfcheckout" width={48} height={48} priority className="h-12 w-12" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Selfcheckout</p>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Welcome to Selfcheckout Express</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Pick the experience you&apos;re about to use and we&apos;ll tailor the steps for you.
        </p>
      </header>

      {selectedType === null ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {storeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedType(option.id)}
              className="surface-card flex flex-col gap-2 rounded-3xl border border-transparent p-5 text-left text-slate-900 transition hover:shadow-lg dark:text-slate-100"
            >
              <span className="text-lg font-semibold">{option.title}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">{option.description}</span>
              {option.helper ? <span className="text-[11px] text-slate-500 dark:text-slate-400">{option.helper}</span> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5 rounded-3xl surface-card p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected experience</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{option?.title}</h2>
              {option?.description ? (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{option.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedType(null);
                setError(null);
                setRetailerCode('');
                setPhone('');
                setTableNumber('');
                setGuestCount('');
                setTrainNumber('');
                setCoach('');
                setSeat('');
              }}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
            >
              Change
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
              Store code (email or ID)
              <input
                required
                value={retailerCode}
                onChange={(event) => setRetailerCode(event.target.value)}
                className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                placeholder={selectedType === 'KIRANA' ? 'lakshmi@demo.shop' : 'restaurant@example.com'}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
              Your phone (for receipt)
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                placeholder="Optional"
              />
            </label>

            {selectedType === 'RESTAURANT' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  Table number
                  <input
                    value={tableNumber}
                    onChange={(event) => setTableNumber(event.target.value)}
                    className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                    placeholder="E.g., T12"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  Guests
                  <input
                    value={guestCount}
                    onChange={(event) => setGuestCount(event.target.value)}
                    className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                    placeholder="Number of diners"
                  />
                </label>
              </div>
            ) : null}

            {selectedType === 'TRAIN' ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  Train number
                  <input
                    required
                    value={trainNumber}
                    onChange={(event) => setTrainNumber(event.target.value)}
                    className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                    placeholder="E.g., 12627"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  Coach
                  <input
                    value={coach}
                    onChange={(event) => setCoach(event.target.value)}
                    className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                    placeholder="E.g., B2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  Seat / berth
                  <input
                    value={seat}
                    onChange={(event) => setSeat(event.target.value)}
                    className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
                    placeholder="E.g., 21"
                  />
                </label>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-500 dark:text-red-300">{error}</p> : null}
            <button
              type="submit"
              disabled={startSessionMutation.isPending}
              className="brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {startSessionMutation.isPending ? 'Starting...' : 'Begin self checkout'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};

export default HomePage;
