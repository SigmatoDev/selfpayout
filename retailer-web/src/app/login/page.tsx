'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { setAuthToken } from '@/lib/auth';
import ThemeToggle from '@/components/theme-toggle';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    retailerId?: string;
  };
}

const RetailerLoginPage = () => {
  const router = useRouter();
  const [shopCode, setShopCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.post<LoginResponse>('auth/login', {
        email: shopCode,
        password,
        role: 'RETAILER_ADMIN'
      });

      setAuthToken(result.token);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-slate-900 dark:text-slate-100">
        <div className="surface-card w-full max-w-sm rounded-3xl p-8 shadow-lg dark:shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Image src="/brand-logo.svg" alt="Selfcheckout" width={40} height={40} priority className="h-10 w-10" />
              <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Shop login</h1>
              <p className="text-xs text-slate-600 dark:text-slate-300">Access your billing and inventory tools.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">Enter shop email and password to begin billing.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">Shop email</span>
            <input
              value={shopCode}
              onChange={(event) => setShopCode(event.target.value)}
              required
              className="input-surface mt-1 w-full rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="you@shop.com"
              type="email"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              className="input-surface mt-1 w-full rounded-xl px-3 py-3 text-sm focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="••••••"
            />
          </label>
          {error ? <p className="text-sm text-red-500 dark:text-red-300">{error}</p> : null}
          <button
            className="brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
      </main>
      <p className="text-center text-xs text-slate-600 dark:text-slate-300">
        New retailer?{' '}
        <Link href="/signup" className="font-semibold text-[color:var(--brand-blue)] dark:text-[color:var(--brand-green)]">
          Apply for onboarding
        </Link>
      </p>
    </>
  );
};

export default RetailerLoginPage;
