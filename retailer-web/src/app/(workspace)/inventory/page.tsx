'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CurrentUserResponse } from '@/lib/types';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  taxPercentage: number;
  mrp?: number;
  unit?: string;
  barcode?: string;
}

interface ApiCollection<T> {
  data: T;
}

interface ApiResource<T> {
  data: T;
}

type InventoryItemRequest = {
  retailerId: string;
  sku: string;
  name: string;
  price: number;
  mrp?: number;
  taxPercentage?: number;
  stockQuantity?: number;
  unit?: string;
  barcode?: string;
};

type BulkUploadRow = Omit<InventoryItemRequest, 'retailerId'>;

interface BulkUploadResponse {
  message: string;
  count: number;
}

const REQUIRED_HEADERS = ['sku', 'name', 'price'] as const;

const createInitialFormState = () => ({
  sku: '',
  name: '',
  price: '',
  mrp: '',
  taxPercentage: '0',
  stockQuantity: '0',
  unit: 'pcs',
  barcode: ''
});

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const parseBulkCsv = (input: string): BulkUploadRow[] => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const headerColumns = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const headerIndex = new Map<string, number>();
  headerColumns.forEach((header, index) => {
    if (header) {
      headerIndex.set(header, index);
    }
  });

  const missingRequired = REQUIRED_HEADERS.filter((header) => !headerIndex.has(header));
  if (missingRequired.length > 0) {
    throw new Error(`Missing required column(s): ${missingRequired.join(', ')}`);
  }

  const items: BulkUploadRow[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const rawLine = lines[rowIndex];
    if (!rawLine.trim()) continue;

    const cells = parseCsvLine(rawLine);
    const isEmpty = cells.every((cell) => cell.trim() === '');
    if (isEmpty) continue;

    const read = (key: string) => {
      const normalized = key.toLowerCase();
      const index = headerIndex.get(normalized);
      if (index === undefined) return '';
      return cells[index]?.trim() ?? '';
    };

    const sku = read('sku');
    const name = read('name');
    const priceValue = read('price');

    if (!sku || !name) {
      throw new Error(`Row ${rowIndex + 1}: SKU and Name are required.`);
    }

    const price = Number(priceValue);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Row ${rowIndex + 1}: Price must be a non-negative number.`);
    }

    const stockRaw = read('stockquantity');
    const stockQuantity = stockRaw ? Number(stockRaw) : 0;
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new Error(`Row ${rowIndex + 1}: Stock quantity must be a whole number.`);
    }

    const taxRaw = read('taxpercentage');
    const taxPercentage = taxRaw ? Number(taxRaw) : 0;
    if (!Number.isFinite(taxPercentage) || taxPercentage < 0 || taxPercentage > 28) {
      throw new Error(`Row ${rowIndex + 1}: Tax percentage must be between 0 and 28.`);
    }

    const mrpRaw = read('mrp');
    const mrp = mrpRaw ? Number(mrpRaw) : undefined;
    if (mrpRaw && (!Number.isFinite(mrp) || mrp < 0)) {
      throw new Error(`Row ${rowIndex + 1}: MRP must be a non-negative number.`);
    }

    const unit = read('unit') || 'pcs';
    const barcode = read('barcode') || undefined;

    items.push({
      sku,
      name,
      price,
      stockQuantity,
      taxPercentage,
      mrp,
      unit,
      barcode
    });
  }

  if (items.length === 0) {
    throw new Error('No data rows found in CSV.');
  }

  return items;
};

const InventoryPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState(createInitialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [bulkItems, setBulkItems] = useState<BulkUploadRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(null);
  const [bulkParsing, setBulkParsing] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.get<CurrentUserResponse>('auth/me')
  });

  const retailerId = currentUser?.user?.retailerId ?? '';

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.inventory,
    queryFn: () => apiClient.get<ApiCollection<InventoryItem[]>>('inventory')
  });

  const createItemMutation = useMutation<ApiResource<InventoryItem>, Error, InventoryItemRequest>({
    mutationFn: (payload) => apiClient.post<ApiResource<InventoryItem>>('inventory', payload),
    onSuccess: () => {
      setFormState(createInitialFormState());
      setFormError(null);
      setFormSuccess('Item saved to inventory.');
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
    onError: (error) => {
      setFormError(error.message);
      setFormSuccess(null);
    }
  });

  const bulkUploadMutation = useMutation<BulkUploadResponse, Error, { retailerId: string; items: BulkUploadRow[] }>({
    mutationFn: (payload) => apiClient.post<BulkUploadResponse>('inventory/bulk', payload),
    onSuccess: (response) => {
      setBulkItems([]);
      setBulkFileName('');
      setBulkFeedback({ variant: 'success', text: `Queued ${response.count} item(s) for processing.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
    },
    onError: (error) => {
      setBulkFeedback({ variant: 'error', text: error.message });
    }
  });

  const items: InventoryItem[] = data?.data ?? [];

  const filtered = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleAddItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!retailerId) {
      setFormError('Retailer context missing. Please sign in again.');
      return;
    }

    const sku = formState.sku.trim();
    const name = formState.name.trim();

    if (!sku || !name) {
      setFormError('SKU and item name are required.');
      return;
    }

    const price = Number(formState.price);
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Price must be a non-negative number.');
      return;
    }

    const stockQuantity = formState.stockQuantity ? Number(formState.stockQuantity) : 0;
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setFormError('Stock quantity must be a whole number.');
      return;
    }

    const taxPercentage = formState.taxPercentage ? Number(formState.taxPercentage) : 0;
    if (!Number.isFinite(taxPercentage) || taxPercentage < 0 || taxPercentage > 28) {
      setFormError('Tax percentage must be between 0 and 28.');
      return;
    }

    const mrp = formState.mrp ? Number(formState.mrp) : undefined;
    if (formState.mrp && (!Number.isFinite(mrp) || mrp < 0)) {
      setFormError('MRP must be a non-negative number.');
      return;
    }

    const payload: InventoryItemRequest = {
      retailerId,
      sku,
      name,
      price,
      stockQuantity,
      taxPercentage,
      unit: formState.unit.trim() || 'pcs',
      barcode: formState.barcode.trim() || undefined,
      ...(mrp !== undefined ? { mrp } : {})
    };

    try {
      await createItemMutation.mutateAsync(payload);
    } catch {
      // handled in onError
    }
  };

  const handleBulkFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setBulkFeedback(null);

    if (!file) {
      setBulkItems([]);
      setBulkFileName('');
      return;
    }

    setBulkParsing(true);

    try {
      const text = await file.text();
      const parsedItems = parseBulkCsv(text);
      setBulkItems(parsedItems);
      setBulkFileName(file.name);
      setBulkFeedback({ variant: 'success', text: `Ready to upload ${parsedItems.length} item(s).` });
    } catch (error) {
      setBulkItems([]);
      setBulkFileName(file.name);
      setBulkFeedback({
        variant: 'error',
        text: error instanceof Error ? error.message : 'Failed to read CSV file.'
      });
    } finally {
      setBulkParsing(false);
      event.target.value = '';
    }
  };

  const handleBulkSubmit = async () => {
    if (!retailerId) {
      setBulkFeedback({ variant: 'error', text: 'Retailer context missing. Please sign in again.' });
      return;
    }

    if (bulkItems.length === 0) {
      setBulkFeedback({ variant: 'error', text: 'Choose a CSV file with inventory rows before uploading.' });
      return;
    }

    try {
      await bulkUploadMutation.mutateAsync({ retailerId, items: bulkItems });
    } catch {
      // handled by onError
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/10 p-4 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Add inventory item</h2>
        <form className="mt-4 space-y-4 text-sm" onSubmit={handleAddItem}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="sku"
              placeholder="SKU*"
              value={formState.sku}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="name"
              placeholder="Name*"
              value={formState.name}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="price"
              placeholder="Price*"
              inputMode="decimal"
              value={formState.price}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="mrp"
              placeholder="MRP"
              inputMode="decimal"
              value={formState.mrp}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="taxPercentage"
              placeholder="Tax %"
              inputMode="numeric"
              value={formState.taxPercentage}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="stockQuantity"
              placeholder="Stock qty"
              inputMode="numeric"
              value={formState.stockQuantity}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="unit"
              placeholder="Unit (pcs/bottle/kg)"
              value={formState.unit}
              onChange={handleFormChange}
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none"
              name="barcode"
              placeholder="Barcode"
              value={formState.barcode}
              onChange={handleFormChange}
            />
          </div>

          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          {formSuccess ? <p className="text-sm text-emerald-400">{formSuccess}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/60"
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? 'Saving...' : 'Save item'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white/10 p-4 text-sm shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Bulk upload (CSV)</h2>
            <p className="text-xs text-slate-300">Columns: sku,name,price,mrp,taxPercentage,stockQuantity,unit,barcode</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900">
              {bulkParsing ? 'Reading...' : 'Choose CSV'}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleBulkFileChange}
                disabled={bulkParsing}
              />
            </label>
            <button
              type="button"
              className="rounded-xl border border-white/40 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:border-white/20 disabled:text-slate-400"
              disabled={bulkUploadMutation.isPending || bulkItems.length === 0}
              onClick={handleBulkSubmit}
            >
              {bulkUploadMutation.isPending
                ? 'Uploading...'
                : bulkItems.length > 0
                  ? `Upload ${bulkItems.length} item(s)`
                  : 'Upload'}
            </button>
          </div>
        </div>
        {bulkFileName ? (
          <p className="mt-2 text-xs text-slate-300">
            {bulkFileName}
            {bulkItems.length > 0 ? ` · ${bulkItems.length} row(s)` : ''}
          </p>
        ) : null}
        {bulkFeedback ? (
          <p
            className={`mt-2 text-sm ${
              bulkFeedback.variant === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {bulkFeedback.text}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inventory</h2>
        </header>

        <div className="rounded-2xl bg-white/10 p-4 text-sm shadow-lg">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <input
              className="flex-1 bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
              placeholder="Search SKU or name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <ul className="mt-4 space-y-3">
            {isLoading ? (
              <li className="rounded-xl bg-black/30 px-3 py-3 text-center text-slate-400">Loading inventory...</li>
            ) : filtered.length === 0 ? (
              <li className="rounded-xl bg-black/30 px-3 py-3 text-center text-slate-400">No items match your search.</li>
            ) : (
              filtered.map((item) => (
                <li key={item.id} className="rounded-xl bg-black/30 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Stock</p>
                      <p className="text-sm font-semibold text-white">{item.stockQuantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="text-sm font-semibold text-white">₹{item.price}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default InventoryPage;
