'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ApiResource, CheckoutSession, TableInfo } from '@/lib/types';

type StoreType = 'KIRANA' | 'RESTAURANT' | 'TRAIN';

interface StartSessionPayload {
  retailerCode: string;
  storeType: StoreType;
  customerPhone?: string;
  groupOrder?: boolean;
  context?: Record<string, string>;
}

const storeOptions: Array<{ id: StoreType; title: string; description: string }> = [
  { id: 'RESTAURANT', title: 'Restaurant', description: 'Self-order at your table with a gate pass after payment.' },
  { id: 'KIRANA', title: 'Kirana store', description: 'Scan items yourself and pay digitally at checkout.' },
  { id: 'TRAIN', title: 'Train kiosk', description: 'Book seats/add-ons and show the QR at the counter.' }
];

const StoreExperiencePage = () => {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const retailerId = params?.id ?? '';
  const defaultType = (search?.get('type') as StoreType) ?? 'RESTAURANT';
  const storeName = search?.get('name') ?? 'Store';
  const [selectedType, setSelectedType] = useState<StoreType>(defaultType);
  const [tableNumber, setTableNumber] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [coach, setCoach] = useState('');
  const [seat, setSeat] = useState('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableError, setTableError] = useState<string | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isGroupOrder, setIsGroupOrder] = useState(false);

  const { data, isLoading, error } = useQuery<ApiResource<CheckoutSession>>({
    queryKey: ['store-session', retailerId],
    queryFn: () => apiClient.get<ApiResource<CheckoutSession>>(`self-checkout/sessions/${retailerId}`),
    enabled: false // placeholder; we start sessions manually below
  });

  const startSessionMutation = useMutation<ApiResource<CheckoutSession>, Error, StartSessionPayload>({
    mutationFn: (payload) => apiClient.post<ApiResource<CheckoutSession>>('self-checkout/sessions', payload),
    onSuccess: (response) => {
      const session = response.data;
      if (typeof window !== 'undefined') {
        const existingRaw = window.localStorage.getItem('selfcheckout-orders');
        const existing: Array<{ id: string; code: string; startedAt: number }> = existingRaw ? JSON.parse(existingRaw) : [];
        const next = [
          { id: session.id, code: session.securityCode, startedAt: Date.now() },
          ...existing.filter((s) => s.id !== session.id)
        ].slice(0, 20);
        window.localStorage.setItem('selfcheckout-orders', JSON.stringify(next));
      }
      router.push(`/session/${session.id}?code=${session.securityCode}`);
    },
    onError: (err) => setMessage(err.message)
  });

  const fetchTables = async () => {
    if (!retailerId || selectedType !== 'RESTAURANT') return;
    setIsLoadingTables(true);
    setTableError(null);
    try {
      const response = await apiClient.get<ApiResource<TableInfo[]>>(
        `restaurants/${encodeURIComponent(retailerId)}/public-tables`
      );
      setTables(response.data);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Unable to load tables');
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    if (selectedType === 'RESTAURANT') {
      fetchTables().catch(() => undefined);
    }
  }, [retailerId, selectedType]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const context: Record<string, string> = {};
    if (selectedType === 'RESTAURANT') {
      if (tableNumber) context.tableNumber = tableNumber;
      if (guestCount) context.guestCount = guestCount;
    }
    if (selectedType === 'TRAIN') {
      if (!trainNumber) {
        setMessage('Enter train number');
        return;
      }
      context.trainNumber = trainNumber;
      if (coach) context.coach = coach;
      if (seat) context.seat = seat;
    }
    startSessionMutation.mutate({
      retailerCode: retailerId,
      storeType: selectedType,
      groupOrder: isGroupOrder,
      context: Object.keys(context).length ? context : undefined
    });
  };

  const handleScanFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setScanError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const BarcodeDetectorCtor = (typeof window !== 'undefined' && (window as any).BarcodeDetector) || null;
      if (!BarcodeDetectorCtor) {
        setScanError('Camera scan not supported on this device.');
        return;
      }
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      if (!codes.length) {
        setScanError('Could not read the QR.');
        return;
      }
      const raw = codes[0].rawValue ?? '';
      const parsed = raw.includes('|') ? raw.split('|').pop() ?? raw : raw;
      setTableNumber(parsed.trim());
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to scan.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const option = useMemo(() => storeOptions.find((o) => o.id === selectedType) ?? storeOptions[0], [selectedType]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-8 text-slate-900 dark:text-slate-100">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Store</p>
        <h1 className="text-2xl font-semibold">{storeName}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Choose your experience and start self checkout.</p>
      </header>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Experience</p>
        <h2 className="text-lg font-semibold">{option.title}</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">{option.description}</p>
      </section>

      {selectedType === 'RESTAURANT' ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Table</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">Pick or enter your table</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleScanFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 dark:border-white/20 dark:text-white"
              >
                Scan table QR
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Group order</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Let friends scan your QR to add items.</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isGroupOrder}
                onChange={(e) => setIsGroupOrder(e.target.checked)}
                className="h-4 w-4"
              />
              Enable
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tables
              .filter((t) => t.status === 'AVAILABLE')
              .map((table) => {
                const isSelected = tableNumber === table.label;
                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setTableNumber(table.label)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-200'
                    }`}
                  >
                    <p className="font-semibold">{table.label}</p>
                    <p className="text-[11px] text-slate-500">Seats {table.capacity}</p>
                  </button>
                );
              })}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
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
          {tableError ? <p className="text-xs text-red-500">{tableError}</p> : null}
          {!tables.length && !isLoadingTables ? (
            <p className="text-xs text-slate-500">No available tables found. Enter manually if needed.</p>
          ) : null}
        </section>
      ) : null}

      {selectedType === 'TRAIN' ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Train details</p>
          <div className="grid gap-3 sm:grid-cols-3">
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
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        {message ? <p className="text-sm text-red-500">{message}</p> : null}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={startSessionMutation.isPending}
          className="brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {startSessionMutation.isPending ? 'Starting...' : 'Start self checkout'}
        </button>
      </section>
    </main>
  );
};

export default StoreExperiencePage;
