"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../../lib/api-client';
import { queryKeys } from '../../../../lib/query-keys';

interface ApiCollection<T> {
  data: T;
}

type RetailerStatus = 'PENDING_ONBOARDING' | 'ACTIVE' | 'SUSPENDED';

interface RetailerRecord {
  id: string;
  name: string;
  shopName: string;
  status: RetailerStatus;
  contactEmail: string;
  contactPhone: string;
  languagePreference?: 'en' | 'hi' | 'ka';
  storeType?: 'KIRANA' | 'RESTAURANT' | 'TRAIN';
  settings?: {
    storageProvider: 'LOCAL' | 'S3';
    selfBillingEnabled?: boolean;
    marketplaceEnabled?: boolean;
    tableOrderingEnabled?: boolean;
    deliveryOrderingEnabled?: boolean;
    tokenOrderingEnabled?: boolean;
    ticketingEnabled?: boolean;
  } | null;
}

type RetailerFeaturePayload = {
  selfBillingEnabled: boolean;
  marketplaceEnabled: boolean;
  tableOrderingEnabled: boolean;
  deliveryOrderingEnabled: boolean;
  tokenOrderingEnabled: boolean;
  ticketingEnabled: boolean;
};

interface InvoiceItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  taxPercentage: number;
}

interface Invoice {
  id: string;
  totalAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
  notes?: string | null;
  items: InvoiceItem[];
}

interface MenuAddOnOption {
  id: string;
  label: string;
  price: number;
  isDefault: boolean;
}

interface MenuAddOnGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  selectionType: 'SINGLE' | 'MULTI';
  options: MenuAddOnOption[];
}

interface RestaurantMenuItem {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  price: number;
  imageUrl?: string | null;
  taxPercentage: number;
  tags: string[];
  isAvailable: boolean;
  isVeg?: boolean | null;
  addOnGroups: MenuAddOnGroup[];
}

interface RestaurantMenuSubCategory {
  id: string;
  name: string;
  description?: string | null;
  items: RestaurantMenuItem[];
}

interface RestaurantMenuCategory {
  id: string;
  name: string;
  description?: string | null;
  menuType?: { id: string; name: string } | null;
  items: RestaurantMenuItem[];
  subCategories: RestaurantMenuSubCategory[];
}

interface RestaurantMenuResponse {
  retailerId: string;
  menuTypes: Array<{ id: string; name: string }>;
  categories: RestaurantMenuCategory[];
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  costPerUnit: number;
  isActive: boolean;
}

interface RecipeItem {
  id: string;
  rawMaterialId: string;
  quantity: number;
  rawMaterial: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
  };
}

interface MenuItemRecipe {
  id: string;
  name: string;
  sku: string;
  category: { id: string; name: string };
  subCategory?: { id: string; name: string } | null;
  recipeItems: RecipeItem[];
}

interface FlattenedMenuItem extends RestaurantMenuItem {
  categoryName: string;
  subCategoryName?: string;
  menuTypeName?: string;
}

const RetailerDetailPage = () => {
  const params = useParams<{ id: string }>();
  const retailerId = params?.id;
  const queryClient = useQueryClient();

  const { data: retailersResponse } = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiCollection<RetailerRecord[]>>('retailers'),
    enabled: Boolean(retailerId)
  });

  const retailer = useMemo(
    () => retailersResponse?.data.find((r) => r.id === retailerId),
    [retailersResponse, retailerId]
  );
  const [message, setMessage] = useState<string | null>(null);

  const updateFeaturesMutation = useMutation({
    mutationFn: (payload: RetailerFeaturePayload) =>
      apiClient.patch<ApiCollection<{ retailer: RetailerRecord }>>(`retailers/${retailerId}`, {
        settings: {
          selfBillingEnabled: payload.selfBillingEnabled,
          marketplaceEnabled: payload.marketplaceEnabled,
          tableOrderingEnabled: payload.tableOrderingEnabled,
          deliveryOrderingEnabled: payload.deliveryOrderingEnabled,
          tokenOrderingEnabled: payload.tokenOrderingEnabled,
          ticketingEnabled: payload.ticketingEnabled
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
      setMessage('Feature controls updated.');
    },
    onError: (error: Error) => {
      setMessage(error.message);
    }
  });

  const { data: invoicesResponse, isLoading: isInvoicesLoading, error: invoicesError } = useQuery({
    queryKey: retailerId ? queryKeys.invoices(retailerId) : ['invoices', 'missing'],
    queryFn: () => apiClient.get<ApiCollection<Invoice[]>>(`receipts?retailerId=${retailerId}`),
    enabled: Boolean(retailerId)
  });

  const restaurantEnabled = retailer?.storeType === 'RESTAURANT' && Boolean(retailerId);

  const {
    data: menuResponse,
    isLoading: isMenuLoading,
    error: menuError
  } = useQuery({
    queryKey: retailerId ? ['restaurant-menu', retailerId] : ['restaurant-menu', 'missing'],
    queryFn: () => apiClient.get<ApiCollection<RestaurantMenuResponse>>(`restaurants/${retailerId}/menu`),
    enabled: restaurantEnabled
  });

  const {
    data: recipesResponse,
    isLoading: isRecipesLoading,
    error: recipesError
  } = useQuery({
    queryKey: retailerId ? ['restaurant-recipes', retailerId] : ['restaurant-recipes', 'missing'],
    queryFn: () => apiClient.get<ApiCollection<MenuItemRecipe[]>>(`restaurants/${retailerId}/recipes`),
    enabled: restaurantEnabled
  });

  const {
    data: materialsResponse,
    isLoading: isMaterialsLoading,
    error: materialsError
  } = useQuery({
    queryKey: retailerId ? ['restaurant-materials', retailerId] : ['restaurant-materials', 'missing'],
    queryFn: () => apiClient.get<ApiCollection<RawMaterial[]>>(`restaurants/${retailerId}/raw-materials`),
    enabled: restaurantEnabled
  });

  const invoices = invoicesResponse?.data ?? [];
  const menu = menuResponse?.data;
  const recipes = recipesResponse?.data ?? [];
  const materials = materialsResponse?.data ?? [];
  const featureSettings = {
    selfBillingEnabled: retailer?.settings?.selfBillingEnabled ?? false,
    marketplaceEnabled: retailer?.settings?.marketplaceEnabled ?? false,
    tableOrderingEnabled: retailer?.settings?.tableOrderingEnabled ?? false,
    deliveryOrderingEnabled: retailer?.settings?.deliveryOrderingEnabled ?? false,
    tokenOrderingEnabled: retailer?.settings?.tokenOrderingEnabled ?? false,
    ticketingEnabled: retailer?.settings?.ticketingEnabled ?? false
  };

  const featureRows = [
    { key: 'selfBillingEnabled', label: 'Self billing', hint: 'In-store kirana self checkout and billing' },
    { key: 'marketplaceEnabled', label: 'Marketplace', hint: 'Online product selling for kirana retailers' },
    { key: 'tableOrderingEnabled', label: 'Restaurant table ordering', hint: 'Restaurant dine-in table ordering flow' },
    { key: 'deliveryOrderingEnabled', label: 'Restaurant delivery ordering', hint: 'Restaurant delivery and remote ordering flow' },
    { key: 'tokenOrderingEnabled', label: 'Restaurant token ordering', hint: 'Restaurant token / quick-service ordering flow' },
    { key: 'ticketingEnabled', label: 'Ticketing', hint: 'Event or venue ticket selling for any retailer type' }
  ] as const;

  const nextFeaturePayload = (
    key: keyof RetailerFeaturePayload,
    checked: boolean
  ): RetailerFeaturePayload => {
    const next = {
      ...featureSettings,
      [key]: checked
    };

    if (key === 'tokenOrderingEnabled' && checked) {
      next.tableOrderingEnabled = false;
    }

    if (key === 'tableOrderingEnabled' && checked) {
      next.tokenOrderingEnabled = false;
    }

    return next;
  };

  const flattenedMenuItems = useMemo<FlattenedMenuItem[]>(() => {
    if (!menu) return [];

    return menu.categories.flatMap((category) => {
      const directItems = category.items.map((item) => ({
        ...item,
        categoryName: category.name,
        menuTypeName: category.menuType?.name
      }));

      const subCategoryItems = category.subCategories.flatMap((subCategory) =>
        subCategory.items.map((item) => ({
          ...item,
          categoryName: category.name,
          subCategoryName: subCategory.name,
          menuTypeName: category.menuType?.name
        }))
      );

      return [...directItems, ...subCategoryItems];
    });
  }, [menu]);

  const recipesByMenuItemId = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link href="/retailers" className="text-xs text-[color:var(--primary)] underline-offset-4 hover:underline">
          ← Back to retailers
        </Link>
        <h1 className="text-2xl font-semibold">{retailer?.shopName ?? 'Retailer details'}</h1>
        <p className="text-sm text-slate-600">Onboarding overview and payment history.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
          <p className="text-lg font-semibold capitalize text-slate-900">
            {retailer?.status?.toLowerCase().replace('_', ' ') ?? 'Unknown'}
          </p>
          <p className="text-sm text-slate-600">
            Contact: {retailer?.contactEmail ?? '—'} • {retailer?.contactPhone ?? '—'}
          </p>
        </div>
        <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Store settings</p>
          <p className="text-sm text-slate-700">
            Storage: {retailer?.settings?.storageProvider ?? 'LOCAL'} • Language:{' '}
            {retailer?.languagePreference ?? 'en'}
          </p>
          <p className="text-xs text-slate-500">Admin can manage customer-facing features below.</p>
          {retailer?.storeType === 'RESTAURANT' ? (
            <Link
              href={`/retailers/${retailer.id}/restaurant-setup`}
              className="inline-block pt-2 text-xs font-medium text-[color:var(--primary)] underline-offset-4 hover:underline"
            >
              Open restaurant setup
            </Link>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-900">Feature controls</p>
          <p className="text-xs text-slate-500">Enable only the flows this retailer should use.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {featureRows.map((feature) => (
            <label
              key={feature.key}
              className="flex items-start justify-between gap-3 rounded-md border border-[color:var(--border)] p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{feature.label}</p>
                <p className="text-xs text-slate-500">{feature.hint}</p>
              </div>
              <input
                type="checkbox"
                checked={featureSettings[feature.key]}
                onChange={(event) =>
                  updateFeaturesMutation.mutate(
                    nextFeaturePayload(feature.key, event.target.checked)
                  )
                }
                disabled={!retailerId || updateFeaturesMutation.isPending}
                className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
              />
            </label>
          ))}
        </div>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </section>

      <section className="space-y-3 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Invoices & payments</p>
            <p className="text-xs text-slate-500">Recent receipts for this retailer</p>
          </div>
        </div>
        {isInvoicesLoading ? <p className="text-sm text-slate-500">Loading invoices...</p> : null}
        {invoicesError ? (
          <p className="text-sm text-red-500">{(invoicesError as Error).message}</p>
        ) : null}
        {invoices.length === 0 && !isInvoicesLoading ? (
          <p className="text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Items</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)] bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-2 text-slate-700">
                      {new Date(invoice.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      ₹{invoice.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{invoice.paymentMode}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {invoice.items.slice(0, 2).map((item) => item.name).join(', ')}
                      {invoice.items.length > 2 ? ` +${invoice.items.length - 2}` : ''}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{invoice.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {retailer?.storeType === 'RESTAURANT' ? (
        <section className="space-y-4 rounded-lg border border-[color:var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Restaurant menu & kitchen data</p>
              <p className="text-xs text-slate-500">
                Live menu items, add-ons, ingredient mappings, and raw material stock for this retailer.
              </p>
            </div>
            <Link
              href={`/retailers/${retailer.id}/restaurant-setup`}
              className="text-xs font-medium text-[color:var(--primary)] underline-offset-4 hover:underline"
            >
              Open restaurant setup
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard label="Menu types" value={menu?.menuTypes.length ?? 0} />
            <SummaryCard label="Categories" value={menu?.categories.length ?? 0} />
            <SummaryCard label="Menu items" value={flattenedMenuItems.length} />
            <SummaryCard label="Raw materials" value={materials.length} />
          </div>

          {isMenuLoading || isRecipesLoading || isMaterialsLoading ? (
            <p className="text-sm text-slate-500">Loading restaurant data...</p>
          ) : null}
          {menuError ? <p className="text-sm text-red-500">{(menuError as Error).message}</p> : null}
          {recipesError ? <p className="text-sm text-red-500">{(recipesError as Error).message}</p> : null}
          {materialsError ? <p className="text-sm text-red-500">{(materialsError as Error).message}</p> : null}

          {!isMenuLoading && flattenedMenuItems.length === 0 ? (
            <p className="text-sm text-slate-500">No menu items configured yet.</p>
          ) : null}

          {flattenedMenuItems.length > 0 ? (
            <div className="space-y-3">
              {flattenedMenuItems.map((item) => {
                const recipe = recipesByMenuItemId.get(item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[color:var(--border)] p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <StatusPill
                            label={item.isAvailable ? 'Available' : 'Unavailable'}
                            tone={item.isAvailable ? 'green' : 'slate'}
                          />
                          {item.isVeg != null ? (
                            <StatusPill
                              label={item.isVeg ? 'Veg' : 'Non-veg'}
                              tone={item.isVeg ? 'green' : 'amber'}
                            />
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500">
                          {[item.menuTypeName, item.categoryName, item.subCategoryName, `SKU ${item.sku}`]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                        {item.description ? (
                          <p className="text-sm text-slate-600">{item.description}</p>
                        ) : null}
                      </div>
                      <div className="text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">₹{item.price.toFixed(2)}</p>
                        <p>Tax {item.taxPercentage}%</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Add-ons
                        </p>
                        {item.addOnGroups.length === 0 ? (
                          <p className="text-sm text-slate-500">No add-ons configured.</p>
                        ) : (
                          <div className="space-y-2">
                            {item.addOnGroups.map((group) => (
                              <div
                                key={group.id}
                                className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              >
                                <p className="font-medium text-slate-900">
                                  {group.name} • {group.selectionType} • {group.min}-{group.max}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {group.options
                                    .map(
                                      (option) =>
                                        `${option.label}${option.price > 0 ? ` (+₹${option.price.toFixed(2)})` : ''}${option.isDefault ? ' default' : ''}`
                                    )
                                    .join(', ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Ingredient mapping
                        </p>
                        {!recipe || recipe.recipeItems.length === 0 ? (
                          <p className="text-sm text-slate-500">No ingredient mapping yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {recipe.recipeItems.map((recipeItem) => (
                              <div
                                key={recipeItem.id}
                                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                              >
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {recipeItem.rawMaterial.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Stock {recipeItem.rawMaterial.currentStock} {recipeItem.rawMaterial.unit}
                                  </p>
                                </div>
                                <p className="text-slate-700">
                                  {recipeItem.quantity} {recipeItem.rawMaterial.unit}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Raw materials
            </p>
            {materials.length === 0 && !isMaterialsLoading ? (
              <p className="text-sm text-slate-500">No raw materials configured yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="rounded-md border border-[color:var(--border)] px-3 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{material.name}</p>
                      <StatusPill
                        label={
                          material.currentStock <= material.reorderLevel ? 'Low stock' : 'In stock'
                        }
                        tone={
                          material.currentStock <= material.reorderLevel ? 'amber' : 'green'
                        }
                      />
                    </div>
                    <p className="mt-1 text-slate-600">
                      Stock {material.currentStock} {material.unit}
                    </p>
                    <p className="text-xs text-slate-500">
                      Reorder at {material.reorderLevel} {material.unit} • Cost ₹
                      {material.costPerUnit.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md border border-[color:var(--border)] bg-slate-50 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

const StatusPill = ({
  label,
  tone
}: {
  label: string;
  tone: 'green' | 'amber' | 'slate';
}) => {
  const className =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-700';

  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
};

export default RetailerDetailPage;
