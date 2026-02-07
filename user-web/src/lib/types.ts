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
  tableNumber?: string | null;
  guestCount?: number | null;
  serviceChargePct?: number | null;
  preferredPaymentMode?: 'CASH' | 'UPI' | 'CARD' | null;
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

export interface MenuAddOnOption {
  id: string;
  label: string;
  price: number;
  isDefault: boolean;
}

export interface MenuAddOnGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: MenuAddOnOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  taxPercentage: number;
  tags: string[];
  isVeg?: boolean | null;
  isAvailable: boolean;
  addOnGroups: MenuAddOnGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  items: MenuItem[];
}

export interface MenuResponse {
  retailerId: string;
  categories: MenuCategory[];
}

export interface TableInfo {
  id: string;
  retailerId: string;
  label: string;
  capacity: number;
  status: string;
}

export interface RetailerSummary {
  id: string;
  shopName: string;
  storeType: 'KIRANA' | 'RESTAURANT' | 'TRAIN';
}
