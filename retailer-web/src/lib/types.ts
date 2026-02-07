export interface CurrentUserResponse {
  user: {
    id: string;
    name: string;
    retailerId?: string;
  };
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

export interface InvoiceItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  taxPercentage: number;
}

export interface Invoice {
  id: string;
  totalAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
  notes?: string | null;
  items: InvoiceItem[];
}
