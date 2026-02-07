'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ApiResource, CheckoutSession, RetailerSummary, TableInfo } from '@/lib/types';
import ThemeToggle from '@/components/theme-toggle';

type StoreType = 'KIRANA' | 'RESTAURANT' | 'TRAIN';

interface StartSessionPayload {
  retailerCode: string;
  customerPhone?: string;
  storeType: StoreType;
  groupOrder?: boolean;
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

const storeImageCatalog: Record<StoreType, string[]> = {
  KIRANA: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=900&q=80'
  ],
  RESTAURANT: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1421622548261-c45bfe178854?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=80'
  ],
  TRAIN: [
    'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=900&q=80'
  ]
};

const storeCategoryThumbs = [
  {
    label: 'Fresh picks',
    image: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Ready-to-eat',
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Daily essentials',
    image: 'https://images.unsplash.com/photo-1481931715705-36f5f79f1f3d?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'Top rated',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  }
];

const HomePage = () => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<StoreType>('RESTAURANT');
  const [retailerCode, setRetailerCode] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [coach, setCoach] = useState('');
  const [seat, setSeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [phoneAuth, setPhoneAuth] = useState('');
  const [otp, setOtp] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticatedRequest, setIsAuthenticatedRequest] = useState(false);
  const { data: retailersData, isLoading: isLoadingRetailers } = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiResource<RetailerSummary[]>>('retailers/public')
  });
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('selfcheckout-user-phone');
    if (stored) {
      setPhoneAuth(stored);
      setIsAuthed(true);
    }
  }, []);

  const handleAuth = (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);
    if (!phoneAuth.trim()) {
      setAuthError('Enter your phone number');
      return;
    }
    if (otp.trim() !== '1234') {
      setAuthError('Invalid OTP. Use 1234 to continue for now.');
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selfcheckout-user-phone', phoneAuth.trim());
    }
    setIsAuthed(true);
    setIsAuthenticatedRequest(true);
  };

  const handleLogout = () => {
    setIsAuthed(false);
    setIsAuthenticatedRequest(false);
    setOtp('');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('selfcheckout-user-phone');
    }
  };

  const option = useMemo(() => storeOptions.find((item) => item.id === selectedType) ?? null, [selectedType]);
  const filteredStores = useMemo(() => {
    const stores = retailersData?.data ?? [];
    const term = storeSearch.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter(
      (store) => store.shopName.toLowerCase().includes(term) || store.storeType.toLowerCase().includes(term)
    );
  }, [retailersData?.data, storeSearch]);

  const storeThumbnailClass = (storeType: StoreType) => {
    if (storeType === 'KIRANA') return 'bg-amber-100 text-amber-700';
    if (storeType === 'TRAIN') return 'bg-indigo-100 text-indigo-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const storeAccentClass = (storeType: StoreType) => {
    if (storeType === 'KIRANA') return 'bg-amber-100 text-amber-700';
    if (storeType === 'TRAIN') return 'bg-indigo-100 text-indigo-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getStoreImage = (store: RetailerSummary) => {
    const pool = storeImageCatalog[store.storeType as StoreType] ?? storeImageCatalog.RESTAURANT;
    const seed = `${store.id}${store.shopName}`.length;
    return pool[seed % pool.length];
  };

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
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedType || !isAuthed) return;
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
        customerPhone: phoneAuth || undefined,
        storeType: selectedType,
        groupOrder: isGroupOrder,
        context: Object.keys(context).length > 0 ? context : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start session');
    }
  };

  const fetchTables = async () => {
    if (!retailerCode || selectedType !== 'RESTAURANT') return;
    setIsAuthenticatedRequest(true);
    setIsLoadingTables(true);
    setTableError(null);
    try {
      const response = await apiClient.get<ApiResource<TableInfo[]>>(
        `restaurants/${encodeURIComponent(retailerCode)}/public-tables`
      );
      setTables(response.data);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Unable to load tables');
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Auto-fetch tables when retailer code changes for restaurants
  useEffect(() => {
    if (selectedType === 'RESTAURANT' && retailerCode) {
      fetchTables().catch(() => undefined);
    }
  }, [retailerCode, selectedType]);

  const handleScanFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setScanError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const BarcodeDetectorCtor = (typeof window !== 'undefined' && (window as any).BarcodeDetector) || null;
      if (!BarcodeDetectorCtor) {
        setScanError('Camera scan not supported on this device. Please enter the code manually.');
        return;
      }

      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      if (!codes.length) {
        setScanError('Could not read the QR. Try again or enter the code manually.');
        return;
      }
      const raw = codes[0].rawValue ?? '';
      const parsed = raw.includes('|') ? raw.split('|').pop() ?? raw : raw;
      setRetailerCode(parsed.trim());
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to scan. Enter code manually.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isAuthed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Selfpayout
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Enter your phone and one-time code to start self checkout.
        </p>
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-800" onSubmit={handleAuth}>
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
            Phone number
            <input
              value={phoneAuth}
              onChange={(e) => setPhoneAuth(e.target.value)}
              className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="Enter your phone"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
            OTP (use 1234)
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="surface-input rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="1234"
              required
            />
          </label>
          {authError ? <p className="text-sm text-red-500">{authError}</p> : null}
          <button
            type="submit"
            className="brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue
          </button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">Use OTP 1234 for now.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-10 text-slate-900 dark:text-slate-100">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-red-600" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Selfcheckout</p>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Welcome to SelfPayout</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Scan the restaurant QR at the entrance or enter the code below to start self-ordering.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Scan QR', desc: 'Open camera', icon: '📷', onClick: () => fileInputRef.current?.click() },
          { label: 'Selfpayout', desc: 'Start checkout', icon: '🛒', onClick: () => router.push('/store/select') },
          { label: 'Marketplace', desc: 'All stores', icon: '🧭', onClick: () => router.push('/marketplace') },
          { label: 'My Orders', desc: 'View orders', icon: '📦', onClick: () => router.push('/orders') },
          { label: 'Stores', desc: 'Nearby stores', icon: '🏪', onClick: () => window.scrollTo({ top: 300, behavior: 'smooth' }) }
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl shadow-sm dark:border-white/20 dark:bg-white/10">
              <span>{action.icon}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-300">{action.desc}</p>
            </div>
          </button>
        ))}
      </section>

      {retailersData?.data?.length ? (
        <section className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white p-5 shadow-lg dark:border-white/10 dark:bg-slate-800">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Storefronts near you</h2>
                <p className="text-xs text-slate-500 dark:text-slate-300">Tap a storefront to view details and start.</p>
                {isLoadingRetailers ? <span className="text-xs text-slate-500">Loading…</span> : null}
              </div>
              <input
                value={storeSearch}
                onChange={(event) => setStoreSearch(event.target.value)}
                className="surface-input w-full rounded-2xl px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none dark:focus:border-emerald-200 sm:max-w-xs"
                placeholder="Search stores..."
              />
            </div>
            <div className="pointer-events-none absolute -top-4 right-2 flex flex-wrap gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-2 text-[11px] text-emerald-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-emerald-100 sm:right-4">
              {['Nearby', 'Popular now', 'Fresh stock'].map((filter) => (
                <span key={filter} className="rounded-full bg-emerald-50/80 px-3 py-1 text-emerald-700 dark:bg-white/10 dark:text-emerald-100">
                  {filter}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {storeCategoryThumbs.map((category) => (
                <div
                  key={category.label}
                  className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                    <Image src={category.image} alt={category.label} width={96} height={96} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{category.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">Curated picks</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-600 p-5 text-white shadow-sm">
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-400/40" />
                <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-lime-300/30" />
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">You are here</p>
                <h3 className="mt-2 text-2xl font-semibold">Current area</h3>
                <p className="mt-2 text-xs text-emerald-100">Browse quick picks and ready-to-shop stores.</p>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 520, behavior: 'smooth' })}
                  className="mt-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm"
                >
                  Explore stores
                </button>
              </div>
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    router.push(`/store/${store.id}?name=${encodeURIComponent(store.shopName)}&type=${store.storeType}`);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      router.push(`/store/${store.id}?name=${encodeURIComponent(store.shopName)}&type=${store.storeType}`);
                    }
                  }}
                  className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="relative h-36 w-full">
                    <Image
                      src={getStoreImage(store)}
                      alt={store.shopName}
                      width={640}
                      height={360}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-800">
                      <span className={`rounded-full px-2 py-0.5 ${storeAccentClass(store.storeType)}`}>
                        {store.storeType.toLowerCase()}
                      </span>
                      <span>★ 4.6</span>
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-base font-semibold">{store.shopName}</p>
                      <p className="text-[11px] text-white/80">12-18 mins • 1.2 km</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Featured for today</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">Open now • Pay at QR</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${storeThumbnailClass(store.storeType)}`}>
                      {store.shopName.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-emerald-100 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-300">
                    <span>Rating 4.6</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/store/${store.id}?name=${encodeURIComponent(store.shopName)}&type=${store.storeType}`);
                      }}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Explore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {selectedStoreName ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-900/20">
          <p className="font-semibold">Selected store: {selectedStoreName}</p>
          <p className="text-xs text-emerald-800 dark:text-emerald-200">Scroll down to pick your experience and start.</p>
        </div>
      ) : null}

      <div id="start" />

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

          {selectedType === 'RESTAURANT' ? (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Scan the restaurant QR to auto-fill.</p>
                <p className="text-xs text-emerald-800">
                  Or enter the code printed near the entrance or table.
                </p>
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
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Open camera
                  </button>
                </div>
            </div>
            {scanError ? <p className="text-xs text-red-600">{scanError}</p> : null}
          </div>
        ) : null}

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
            {selectedType === 'RESTAURANT' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Pick your table
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isGroupOrder}
                      onChange={(e) => setIsGroupOrder(e.target.checked)}
                      className="size-4 rounded border-slate-300"
                    />
                    Group order
                  </label>
                  {isGroupOrder ? (
                    <span className="text-[11px] text-slate-500">
                      Others can scan your session QR to add items.
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {tables
                    .filter((table) => table.status === 'AVAILABLE')
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
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
              </div>
            ) : null}

            {/* Table selection hidden initially; can be re-enabled later if needed */}

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
