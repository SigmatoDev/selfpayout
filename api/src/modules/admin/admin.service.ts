import { prisma } from '../../config/prisma.js';

type ActiveSubscriptionWithPlan = {
  plan?: {
    price?: number | null;
  } | null;
};

export const getPlatformMetrics = async () => {
  const [totalRetailers, activeRetailers, suspendedRetailers, pendingKyc, activeSubscriptions] =
    await prisma.$transaction([
      prisma.retailer.count(),
      prisma.retailer.count({ where: { status: 'ACTIVE' } }),
      prisma.retailer.count({ where: { status: 'SUSPENDED' } }),
      prisma.kyc.count({ where: { status: 'PENDING' } }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true }
      })
    ]);

  const monthlyRecurringRevenue = activeSubscriptions.reduce(
    (total: number, subscription: ActiveSubscriptionWithPlan) => total + (subscription.plan?.price ?? 0),
    0
  );

  return {
    totalRetailers,
    activeRetailers,
    suspendedRetailers,
    pendingKyc,
    activeSubscriptions: activeSubscriptions.length,
    monthlyRecurringRevenue
  };
};
