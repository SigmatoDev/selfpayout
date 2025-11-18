'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLanguage } from '@/lib/language';

const MobileNav = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const routes = [
    { href: '/', label: t('billing') },
    { href: '/inventory', label: t('inventory') },
    { href: '/customers', label: t('customers') },
    { href: '/reports', label: t('reports') },
    { href: '/self-checkout', label: t('self_checkout') }
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 flex justify-around bg-slate-800/90 py-2 backdrop-blur">
      {routes.map((route) => {
        const active = pathname === route.href;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={`flex flex-col items-center text-xs ${active ? 'text-[color:var(--green)]' : 'text-slate-300'}`}
          >
            <span>{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
