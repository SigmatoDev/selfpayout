'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '../../../lib/api-client';
import { setAuthToken } from '../../../lib/auth';

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'lakshmi@demo.shop';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? 'sdsafq5ux';

const featureHighlights = [
  {
    title: 'Realtime oversight',
    description: 'Track onboarding progress, billing health, and payouts for every retailer in one view.'
  },
  {
    title: 'Instant actions',
    description: 'Approve or pause accounts, adjust pricing, and unblock collections in just a few clicks.'
  }
] as const;

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.post<{ token: string }>('auth/login', {
        email,
        password,
        role: 'SUPER_ADMIN'
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
    <div className="w-full max-w-6xl">
      <div className="grid gap-6 rounded-[20px] border border-white/10 bg-white/5 p-4 text-white shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ff5a5f] via-[#d00000] to-[#7a0000] p-8 md:p-10">
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black tracking-tight text-white">
                  SC
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.6em] text-white/70">Super Admin</p>
                  <p className="text-3xl font-semibold">Selfcheckout</p>
                </div>
              </div>
              <p className="text-lg leading-relaxed text-white/90">
                Purpose-built command center for powering every Selfcheckout deployment. Keep retailers humming with rich
                telemetry, faster approvals, and confident billing oversight.
              </p>
              <div className="space-y-4">
                {featureHighlights.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-white">{feature.title}</p>
                    <p className="mt-1 text-sm text-white/80">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          </section>

          <section className="rounded-[28px] bg-white/95 p-8 text-slate-900 shadow-2xl md:p-10">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.6em] text-[#d00000]">Welcome back</p>
              <h1 className="text-3xl font-semibold text-slate-900">Secure console login</h1>
              <p className="text-sm text-slate-500">Authenticate to manage onboarding, subscriptions, and critical payouts.</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 transition focus:border-[#d00000] focus:ring-2 focus:ring-[#d00000]/30 focus:outline-none"
                  placeholder="you@example.com"
                  type="email"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 transition focus:border-[#d00000] focus:ring-2 focus:ring-[#d00000]/30 focus:outline-none"
                  placeholder="Enter your password"
                  type="password"
                />
              </label>
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
              ) : null}
              <button
                className="w-full rounded-2xl bg-[#d00000] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#a40000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d00000] disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-8 space-y-3 rounded-2xl border border-[#d00000]/20 bg-[#fff3f3] p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#d00000]">Demo access</p>
                <span className="text-xs uppercase tracking-[0.4em] text-[#d00000]/70">Preview mode</span>
              </div>
              <div className="space-y-1 font-mono text-xs sm:text-sm">
                <p>
                  Email:{' '}
                  <span className="select-all text-slate-900">{DEMO_EMAIL}</span>
                </p>
                <p>
                  Password:{' '}
                  <span className="select-all text-slate-900">{DEMO_PASSWORD}</span>
                </p>
              </div>
              <p className="text-xs text-slate-500">Use the Selfcheckout demo credentials to explore the full console.</p>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Need full-time access?{' '}
              <Link className="font-semibold text-[#d00000]" href="mailto:ops@selfpayout.com">
                Contact platform ops
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
