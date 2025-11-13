export type CheckoutStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'PAID' | 'APPROVED' | 'CANCELLED';

export interface CheckoutItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  taxPercentage: number;
}

export interface CheckoutSession {
  id: string;
  retailerId: string;
  retailer?: {
    shopName: string;
  };
  customerPhone?: string | null;
  status: CheckoutStatus;
  totalAmount: number;
  securityCode: string;
  storeType: 'KIRANA' | 'RESTAURANT' | 'TRAIN';
  context?: Record<string, unknown> | null;
  items: CheckoutItem[];
  invoice?: {
    id: string;
    totalAmount: number;
    paymentMode: 'CASH' | 'UPI' | 'CARD';
  } | null;
}

export interface ApiResource<T> {
  data: T;
}
