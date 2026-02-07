export const queryKeys = {
  inventory: ['inventory'] as const,
  customers: ['customers'] as const,
  invoices: ['invoices'] as const,
  salesSummary: ['sales-summary'] as const,
  offlineQueue: ['offline-queue'] as const,
  currentUser: ['current-user'] as const,
  selfCheckoutSessions: ['self-checkout-sessions'] as const,
  menu: (retailerId: string) => ['menu', retailerId] as const,
  tables: (retailerId: string) => ['tables', retailerId] as const,
  invoices: (retailerId: string) => ['invoices', retailerId] as const
};
