"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import { apiClient } from '../../../../../lib/api-client';
import { queryKeys } from '../../../../../lib/query-keys';

interface ApiCollection<T> {
  data: T;
}

interface RetailerRecord {
  id: string;
  shopName: string;
  storeType?: 'KIRANA' | 'RESTAURANT' | 'TRAIN';
}

interface RestaurantSetupState {
  tableOrderingEnabled: boolean;
  deliveryOrderingEnabled: boolean;
  tokenOrderingEnabled: boolean;
  tableGroupsRaw: string;
  tokensRaw: string;
  tables: Array<{ label: string; capacity: number; groupLabel: string }>;
  menuTypesRaw: string;
  categories: Array<{ name: string; menuTypeName: string }>;
  subCategories: Array<{ categoryName: string; name: string }>;
}

const RestaurantSetupPage = () => {
  const params = useParams<{ id: string }>();
  const retailerId = params?.id;
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<RestaurantSetupState>({
    tableOrderingEnabled: true,
    deliveryOrderingEnabled: true,
    tokenOrderingEnabled: false,
    tableGroupsRaw: '',
    tokensRaw: '',
    tables: [{ label: '', capacity: 2, groupLabel: '' }],
    menuTypesRaw: 'Veg\nNon-Veg',
    categories: [{ name: '', menuTypeName: '' }],
    subCategories: [{ categoryName: '', name: '' }]
  });

  const retailersQuery = useQuery({
    queryKey: queryKeys.retailers,
    queryFn: () => apiClient.get<ApiCollection<RetailerRecord[]>>('retailers'),
    enabled: Boolean(retailerId)
  });

  const retailer = useMemo(
    () => retailersQuery.data?.data.find((item) => item.id === retailerId),
    [retailersQuery.data, retailerId]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tableGroups = state.tableGroupsRaw
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const tokens = state.tokensRaw
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const menuTypes = state.menuTypesRaw
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
      const categories = state.categories
        .map((category) => ({
          name: category.name.trim(),
          menuTypeName: category.menuTypeName.trim() || undefined
        }))
        .filter((category) => category.name);
      const payload = {
        menuTypes,
        categories: categories.map((category) => ({
          name: category.name,
          menuTypeName: category.menuTypeName,
          items: [],
          subCategories: state.subCategories
            .map((subCategory) => ({
              categoryName: subCategory.categoryName.trim(),
              name: subCategory.name.trim()
            }))
            .filter((subCategory) => subCategory.categoryName === category.name && subCategory.name)
            .map((subCategory) => ({
              name: subCategory.name,
              items: []
            }))
        }))
      };

      await apiClient.patch(`restaurants/${retailerId}/settings`, {
        tableOrderingEnabled: state.tableOrderingEnabled,
        deliveryOrderingEnabled: state.deliveryOrderingEnabled,
        tokenOrderingEnabled: state.tokenOrderingEnabled
      });

      for (const name of tableGroups) {
        await apiClient.post(`restaurants/${retailerId}/table-groups`, { name });
      }

      for (const table of state.tables) {
        if (!table.label.trim()) continue;
        await apiClient.post(`restaurants/${retailerId}/tables`, {
          label: table.label.trim(),
          capacity: Number(table.capacity || 2),
          groupLabel: table.groupLabel.trim() || undefined
        });
      }

      for (const label of tokens) {
        await apiClient.post(`restaurants/${retailerId}/tokens`, { label });
      }

      await apiClient.post(`restaurants/${retailerId}/menu`, payload);
    },
    onSuccess: () => {
      setMessage('Restaurant setup saved successfully.');
    },
    onError: (error: Error) => {
      setMessage(error.message);
    }
  });

  const updateTable = (index: number, field: 'label' | 'capacity' | 'groupLabel', value: string | number) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.map((table, tableIndex) =>
        tableIndex === index ? { ...table, [field]: value } : table
      )
    }));
  };

  const updateCategory = (index: number, field: 'name' | 'menuTypeName', value: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, [field]: value } : category
      )
    }));
  };

  const updateSubCategory = (index: number, field: 'categoryName' | 'name', value: string) => {
    setState((prev) => ({
      ...prev,
      subCategories: prev.subCategories.map((subCategory, subCategoryIndex) =>
        subCategoryIndex === index ? { ...subCategory, [field]: value } : subCategory
      )
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link href="/retailers" className="text-xs text-[color:var(--primary)] underline-offset-4 hover:underline">
          ← Back to retailers
        </Link>
        <h1 className="text-2xl font-semibold">
          Restaurant setup {retailer?.shopName ? `• ${retailer.shopName}` : ''}
        </h1>
        <p className="text-sm text-slate-600">
          Apply the same initial setup areas available in the retailer app: ordering settings, groups, tables, tokens, and menu structure.
        </p>
      </header>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ordering settings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Toggle
            label="Table ordering"
            checked={state.tableOrderingEnabled}
            onChange={(checked) =>
              setState((prev) => ({
                ...prev,
                tableOrderingEnabled: checked,
                tokenOrderingEnabled: checked ? false : prev.tokenOrderingEnabled
              }))
            }
          />
          <Toggle
            label="Delivery ordering"
            checked={state.deliveryOrderingEnabled}
            onChange={(checked) => setState((prev) => ({ ...prev, deliveryOrderingEnabled: checked }))}
          />
          <Toggle
            label="Token ordering"
            checked={state.tokenOrderingEnabled}
            onChange={(checked) =>
              setState((prev) => ({
                ...prev,
                tokenOrderingEnabled: checked,
                tableOrderingEnabled: checked ? false : prev.tableOrderingEnabled
              }))
            }
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CardSection title="Table groups" description="One group per line">
          <textarea
            rows={8}
            value={state.tableGroupsRaw}
            onChange={(event) => setState((prev) => ({ ...prev, tableGroupsRaw: event.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
            placeholder={'Ground Floor\nPatio\nFamily Hall'}
          />
        </CardSection>

        <CardSection title="Tokens" description="One token number per line">
          <textarea
            rows={8}
            value={state.tokensRaw}
            onChange={(event) => setState((prev) => ({ ...prev, tokensRaw: event.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
            placeholder={'1\n2\n3-1'}
          />
        </CardSection>
      </section>

      <CardSection title="Tables" description="Configure initial table labels and capacities">
        <div className="space-y-3">
          {state.tables.map((table, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-3">
              <input
                value={table.label}
                onChange={(event) => updateTable(index, 'label', event.target.value)}
                placeholder="Table number"
                className="rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
              <input
                type="number"
                min={1}
                max={20}
                value={table.capacity}
                onChange={(event) => updateTable(index, 'capacity', Number(event.target.value))}
                placeholder="Capacity"
                className="rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={table.groupLabel}
                  onChange={(event) => updateTable(index, 'groupLabel', event.target.value)}
                  placeholder="Group"
                  className="flex-1 rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      tables: prev.tables.filter((_, tableIndex) => tableIndex !== index)
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                tables: [...prev.tables, { label: '', capacity: 2, groupLabel: '' }]
              }))
            }
            className="rounded-md border border-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary)]"
          >
            Add table
          </button>
        </div>
      </CardSection>

      <section className="grid gap-4 lg:grid-cols-2">
        <CardSection title="Menu types" description="One type per line">
          <textarea
            rows={8}
            value={state.menuTypesRaw}
            onChange={(event) => setState((prev) => ({ ...prev, menuTypesRaw: event.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
            placeholder={'Veg\nNon-Veg\nBeverages'}
          />
        </CardSection>

        <CardSection title="Menu categories" description="Assign each category to a menu type if needed">
          <div className="space-y-3">
            {state.categories.map((category, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                <input
                  value={category.name}
                  onChange={(event) => updateCategory(index, 'name', event.target.value)}
                  placeholder="Category name"
                  className="rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    value={category.menuTypeName}
                    onChange={(event) => updateCategory(index, 'menuTypeName', event.target.value)}
                    placeholder="Menu type"
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        categories: prev.categories.filter((_, categoryIndex) => categoryIndex !== index)
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  categories: [...prev.categories, { name: '', menuTypeName: '' }]
                }))
              }
              className="rounded-md border border-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary)]"
            >
              Add category
            </button>
          </div>
        </CardSection>
      </section>

      <CardSection title="Menu sub-categories" description="Optional structure under each category">
        <div className="space-y-3">
          {state.subCategories.map((subCategory, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
              <input
                value={subCategory.categoryName}
                onChange={(event) => updateSubCategory(index, 'categoryName', event.target.value)}
                placeholder="Parent category"
                className="rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={subCategory.name}
                  onChange={(event) => updateSubCategory(index, 'name', event.target.value)}
                  placeholder="Sub-category name"
                  className="flex-1 rounded-md border border-slate-200 px-3 py-2 focus:border-[color:var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      subCategories: prev.subCategories.filter((_, subCategoryIndex) => subCategoryIndex !== index)
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                subCategories: [...prev.subCategories, { categoryName: '', name: '' }]
              }))
            }
            className="rounded-md border border-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary)]"
          >
            Add sub-category
          </button>
        </div>
      </CardSection>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="rounded-md bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving setup...' : 'Save restaurant setup'}
        </button>
        <Link
          href={`/retailers/${retailerId}`}
          className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700"
        >
          Retailer detail
        </Link>
      </div>
    </div>
  );
};

const CardSection = ({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    {children}
  </section>
);

const Toggle = ({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
    {label}
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-[color:var(--primary)]"
    />
  </label>
);

export default RestaurantSetupPage;
