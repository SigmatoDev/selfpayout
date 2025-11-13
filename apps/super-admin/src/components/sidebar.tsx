'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: 'Dashboard' },
  { href: '/retailers', label: 'Retailers' },
  { href: '/subscriptions', label: 'Plans' },
  { href: '/kyc', label: 'KYC Reviews' }
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-[color:var(--border)] bg-white p-4">
      <div className="mb-6 flex items-center gap-3">
        <Image src="/brand-logo.svg" alt="Selfcheckout" width={32} height={32} className="h-8 w-8" />
        <div>
          <div className="text-sm font-semibold text-slate-900">Selfcheckout</div>
          <p className="text-xs text-slate-500">Super admin</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 ${
                isActive ? 'bg-[color:var(--primary)] text-white' : 'hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
