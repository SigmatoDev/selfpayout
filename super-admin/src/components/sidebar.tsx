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
    <aside className="w-full rounded-[20px] bg-[color:var(--primary)] p-6 text-white shadow-[0_30px_80px_rgba(208,0,0,0.3)] lg:w-72">
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
        <Image src="/selfpayout-logo.png" alt="Selfcheckout" width={40} height={40} className="h-9 w-9 object-contain" priority />
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Super Admin</p>
          <p className="text-base font-semibold">Selfcheckout</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-2 text-sm font-medium">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-3 transition ${
                isActive ? 'bg-white text-[color:var(--primary)] shadow' : 'hover:bg-white/15'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/80">
        <p className="font-semibold text-white">Need help?</p>
        <p className="mt-1">ops@getselfcheckout.com</p>
      </div>
    </aside>
  );
};

export default Sidebar;
