'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useLanguage } from '@/lib/language';

const MobileNav = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
   const [open, setOpen] = useState(false);

  const routes = [
    { href: '/', label: 'Dashboard' },
    { href: '/billing', label: t('billing') },
    { href: '/inventory', label: t('inventory') },
    { href: '/customers', label: t('customers') },
    { href: '/menu', label: 'Menu' },
    { href: '/tables', label: 'Tables' },
    { href: '/payments', label: 'Payments' },
    { href: '/reports', label: t('reports') },
    { href: '/self-checkout', label: t('self_checkout') }
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((val) => !val)}
        className="fixed left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md shadow-slate-900/5 transition hover:border-slate-300 hover:shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
      >
        <span className="text-lg">☰</span>
        <span>Menu</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white p-4 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Navigation</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:text-slate-100"
              >
                Close
              </button>
            </div>
            <nav className="space-y-2 text-sm">
              {routes.map((route) => {
                const active = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`block rounded-lg px-3 py-2 ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {route.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
