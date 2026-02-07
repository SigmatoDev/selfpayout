export const queryKeys = {
  retailers: ['retailers'] as const,
  plans: ['subscription-plans'] as const,
  kyc: ['kyc-records'] as const,
  metrics: ['platform-metrics'] as const,
  invoices: (retailerId: string) => ['invoices', retailerId] as const,
  ticketingEvents: ['ticketing-events'] as const,
  ticketingOrders: ['ticketing-orders'] as const,
  marketplaceOrders: ['marketplace-orders'] as const,
  counterOrders: ['counter-orders'] as const
};
