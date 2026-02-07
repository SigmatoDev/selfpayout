'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { getAuthToken, clearAuthToken } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { queryKeys } from '@/lib/query-keys';
import type { CurrentUserResponse } from '@/lib/types';
import MobileNav from '@/components/mobile-nav';
import ThemeToggle from '@/components/theme-toggle';
import Sidebar from '@/components/sidebar';

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useLanguage();

  const hasToken = typeof window !== 'undefined' ? Boolean(getAuthToken()) : false;

  const { data, error } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.get<CurrentUserResponse>('auth/me'),
    enabled: hasToken
  });

  useEffect(() => {
    if (!hasToken) {
      router.push('/login');
    }
  }, [hasToken, router]);

  useEffect(() => {
    if (error) {
      clearAuthToken();
      router.push('/login');
    }
  }, [error, router]);

  const userName = data?.user?.name ?? 'Retailer';

  const handleLogout = useCallback(() => {
    clearAuthToken();
    queryClient.clear();
    router.push('/login');
  }, [queryClient, router]);

  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-10 pt-6 text-sm text-slate-700 dark:text-slate-200">
      <div className="flex gap-4">
        <Sidebar />
        <div className="flex-1 space-y-6">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image src="/brand-logo.svg" alt="Selfcheckout logo" width={44} height={44} priority className="h-11 w-11" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Selfcheckout POS</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Retailer workspace</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-3 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                >
                  {language === 'en' ? 'हिन्दी' : 'English'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200"
                >
                  Logout
                </button>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {t('welcome')}, {userName}!
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Quick billing, customer balance tracking, and offline support.
              </p>
            </div>
          </header>
          <section className="space-y-4">{children}</section>
        </div>
      </div>
      <MobileNav />
    </main>
  );
};

export default WorkspaceLayout;
