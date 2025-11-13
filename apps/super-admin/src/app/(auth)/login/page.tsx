'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '../../../lib/api-client';
import { setAuthToken } from '../../../lib/auth';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur">
      <h1 className="text-2xl font-semibold">Super admin access</h1>
      <p className="mt-2 text-sm text-slate-200">Manage retailer onboarding, subscriptions, and billing.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="text-slate-200">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-white/60 focus:outline-none"
            placeholder="you@example.com"
            type="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-200">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-white/60 focus:outline-none"
            placeholder="••••••"
            type="password"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-300">
        Need access? <Link className="font-medium text-white" href="mailto:ops@getselfcheckout.com">Contact platform ops</Link>
      </div>
    </div>
  );
};

export default LoginPage;
