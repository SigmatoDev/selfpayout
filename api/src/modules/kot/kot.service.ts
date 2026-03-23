import type { Prisma } from '@prisma/client';

const pad = (value: number, length: number) => value.toString().padStart(length, '0');

const formatDateKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1, 2);
  const day = pad(date.getUTCDate(), 2);
  return `${year}${month}${day}`;
};

export const generateKotNumber = async (tx: Prisma.TransactionClient, retailerId: string) => {
  const now = new Date();
  const dateKey = formatDateKey(now);
  const prefix = `KOT-${dateKey}-`;

  const [sessionCount, counterCount] = await Promise.all([
    (tx as any).selfCheckoutSession.count({
      where: {
        retailerId,
        kotNumber: { startsWith: prefix }
      }
    }),
    tx.counterOrder.count({
      where: {
        retailerId,
        kotNumber: { startsWith: prefix }
      }
    })
  ]);

  const next = sessionCount + counterCount + 1;
  return `${prefix}${pad(next, 3)}`;
};
