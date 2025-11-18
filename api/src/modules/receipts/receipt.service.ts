import { prisma } from '../../config/prisma.js';
import type { CreateInvoiceInput } from './receipt.schema.js';

type InvoiceTotals = { subtotal: number; tax: number; total: number };

const calculateTotals = (items: CreateInvoiceInput['items']): InvoiceTotals => {
  return items.reduce(
    (acc, item) => {
      const lineSubtotal = item.price * item.quantity;
      const lineTax = (lineSubtotal * item.taxPercentage) / 100;
      acc.subtotal += lineSubtotal;
      acc.tax += lineTax;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );
};

export const createInvoice = async (input: CreateInvoiceInput) => {
  const totals = calculateTotals(input.items);
  totals.total = totals.subtotal + totals.tax;

  const invoice = await prisma.invoice.create({
    data: {
      retailerId: input.retailerId,
      paymentMode: input.paymentMode,
      notes: input.notes ?? null,
      subtotalAmount: totals.subtotal,
      taxAmount: totals.tax,
      totalAmount: totals.total,
      customerPhone: input.customerPhone ?? null,
      items: {
        create: input.items.map((item) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          taxPercentage: item.taxPercentage
        }))
      }
    },
    include: { items: true }
  });

  return { invoice, totals };
};

export const listInvoices = (retailerId: string) =>
  prisma.invoice.findMany({
    where: { retailerId },
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' }
  });
