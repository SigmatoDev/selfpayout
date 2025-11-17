import { prisma } from '../../config/prisma';
import type { CustomerInput } from './customer.schema';

export const listCustomers = (retailerId: string) =>
  prisma.customer.findMany({
    where: { retailerId },
    include: { invoices: true },
    orderBy: { updatedAt: 'desc' }
  });

export const upsertCustomer = async (input: CustomerInput) => {
  const retailer = await prisma.retailer.findUnique({ where: { id: input.retailerId } });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  return prisma.customer.upsert({
    where: { retailerId_phone: { retailerId: input.retailerId, phone: input.phone } },
    update: input,
    create: input
  });
};

export const fetchCustomerHistory = (retailerId: string, customerId: string) =>
  prisma.invoice.findMany({
    where: { retailerId, customerId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
