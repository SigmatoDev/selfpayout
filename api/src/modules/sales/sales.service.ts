import { prisma } from '../../config/prisma';

export const getDailySalesSummary = async (retailerId: string, from?: Date, to?: Date) => {
  const sales = await prisma.invoice.groupBy({
    where: {
      retailerId,
      createdAt: {
        gte: from,
        lte: to
      }
    },
    by: ['paymentMode'],
    _sum: {
      totalAmount: true,
      taxAmount: true
    }
  });

  const totals = sales.reduce(
    (acc, sale) => {
      acc.total += sale._sum.totalAmount ?? 0;
      acc.tax += sale._sum.taxAmount ?? 0;
      acc.byPaymentMode[sale.paymentMode] = sale._sum.totalAmount ?? 0;
      return acc;
    },
    { total: 0, tax: 0, byPaymentMode: {} as Record<string, number> }
  );

  return totals;
};

export const getOutstandingLedger = (retailerId: string) =>
  prisma.customer.findMany({
    where: { retailerId, balanceAmount: { gt: 0 } },
    select: { id: true, name: true, phone: true, balanceAmount: true }
  });
