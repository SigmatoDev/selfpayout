interface StoredInvoice {
  id: string;
  payload: InvoicePayload;
  createdAt: number;
}

export interface InvoiceItemPayload {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  taxPercentage: number;
}

export interface InvoicePayload {
  retailerId: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  customerPhone?: string;
  notes?: string;
  items: InvoiceItemPayload[];
}

const STORAGE_KEY = 'selfcheckout_offline_invoices';

const readQueue = (): StoredInvoice[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredInvoice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const writeQueue = (queue: StoredInvoice[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const getOfflineInvoices = () => readQueue();

export const enqueueOfflineInvoice = (payload: InvoicePayload) => {
  const queue = readQueue();
  queue.push({ id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2), payload, createdAt: Date.now() });
  writeQueue(queue);
  return queue.length;
};

export const clearOfflineInvoices = () => writeQueue([]);

export const removeOfflineInvoice = (id: string) => {
  const queue = readQueue().filter((entry) => entry.id !== id);
  writeQueue(queue);
  return queue;
};
