'use client';

import Link from 'next/link';

const DashboardPage = () => {
  const tiles = [
    { title: 'Billing', desc: 'Create an order and collect payment.', href: '/billing', emoji: '🧾' },
    { title: 'Self checkout', desc: 'Monitor sessions and tickets.', href: '/self-checkout', emoji: '🛒' },
    { title: 'Payments', desc: 'Mark payouts and receipts.', href: '/payments', emoji: '💳' },
    { title: 'Bills', desc: 'View invoices and receipts.', href: '/payments', emoji: '📂' },
    { title: 'Inventory', desc: 'Manage SKUs and stock.', href: '/inventory', emoji: '📦' },
    { title: 'Menu', desc: 'Restaurant menu builder.', href: '/menu', emoji: '🍽️' },
    { title: 'Tables', desc: 'Table layout and status.', href: '/tables', emoji: '🪑' },
    { title: 'Customers', desc: 'Customer ledger & history.', href: '/customers', emoji: '👥' },
    { title: 'Reports', desc: 'Daily summaries.', href: '/reports', emoji: '📊' }
  ];

  const stats = [
    { label: 'Today revenue', value: '₹0.00', hint: 'Sync to see live data' },
    { label: 'Open sessions', value: '—', hint: 'Self checkout queue' },
    { label: 'Pending payouts', value: '—', hint: 'Mark payments to update' }
  ];

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <section className="grid gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className="surface-card flex flex-col gap-1 rounded-2xl border border-slate-200/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{tile.emoji}</span>
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Shortcut</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tile.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{tile.desc}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="surface-card rounded-2xl border border-slate-200/70 p-4 shadow-sm dark:border-white/10"
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">{stat.hint}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardPage;
