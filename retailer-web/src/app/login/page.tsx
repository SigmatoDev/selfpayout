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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.post<LoginResponse>('auth/login-otp', {
        phone,
        otp,
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
        <div className="surface-card w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Image src="/brand-logo.svg" alt="Selfcheckout" width={40} height={40} priority className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Shop login</h1>
                <p className="text-xs text-slate-600">Access your billing and inventory tools.</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="mt-6 text-sm text-slate-600">Enter registered phone and OTP to continue.</p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="text-slate-700">Phone number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                className="input-surface mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="9876543210"
                type="tel"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700">OTP</span>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
                type="text"
                inputMode="numeric"
                className="input-surface mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="123456"
              />
            </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            className="brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="mt-6 space-y-2 rounded-xl bg-slate-100/70 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">New here?</p>
            <p className="text-xs text-slate-600">Create your restaurant/retailer account to start onboarding.</p>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[color:var(--green)] px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-105"
            >
              Start onboarding
            </Link>
          </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default RetailerLoginPage;
