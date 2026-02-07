'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/billing', label: 'Billing' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/customers', label: 'Customers' },
    { href: '/payments', label: 'Payments' },
    { href: '/menu', label: 'Menu' },
    { href: '/tables', label: 'Tables' },
    { href: '/reports', label: 'Reports' },
    { href: '/self-checkout', label: 'Self checkout' }
  ];

  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Navigation</h2>
      <nav className="space-y-1 text-sm">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 ${
                active
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
