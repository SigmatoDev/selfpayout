export const queryKeys = {
  session: (id: string) => ['session', id] as const,
  menu: (retailerId: string) => ['menu', retailerId] as const,
  retailers: ['retailers-public'] as const
};
