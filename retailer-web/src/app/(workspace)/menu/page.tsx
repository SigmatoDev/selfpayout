'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CurrentUserResponse, MenuCategory, MenuResponse } from '@/lib/types';

interface ApiResource<T> {
  data: T;
}

type EditableCategory = Omit<MenuCategory, 'id'> & { id?: string };
type EditableItem = EditableCategory['items'][number];

const emptyItem = (): EditableItem => ({
  id: undefined,
  name: '',
  sku: '',
  price: 0,
  taxPercentage: 0,
  tags: [],
  isAvailable: true,
  addOnGroups: []
});

const MenuPage = () => {
  const queryClient = useQueryClient();
  const { data: userData } = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.get<CurrentUserResponse>('auth/me')
  });

  const retailerId = userData?.user?.retailerId;

  const { data, isLoading, error } = useQuery({
    queryKey: retailerId ? queryKeys.menu(retailerId) : ['menu', 'missing'],
    queryFn: () => apiClient.get<ApiResource<MenuResponse>>(`restaurants/${retailerId}/menu`),
    enabled: Boolean(retailerId)
  });

  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [editing, setEditing] = useState<{
    categoryIndex: number;
    itemIndex: number;
    draft: EditableItem;
  } | null>(null);

  useEffect(() => {
    if (data?.data?.categories) {
      setCategories(
        data.data.categories.map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
            addOnGroups: item.addOnGroups?.map((group) => ({
              ...group,
              options: group.options?.map((opt) => ({ ...opt })) ?? []
            })) ?? []
          }))
        }))
      );
    }
  }, [data]);

  const cloneItem = (item: EditableItem): EditableItem => ({
    ...item,
    addOnGroups: item.addOnGroups?.map((group) => ({
      ...group,
      options: group.options?.map((opt) => ({ ...opt })) ?? []
    })) ?? []
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResource<MenuResponse>>(`restaurants/${retailerId}/menu`, {
        categories: categories.map((category, categoryIndex) => ({
          name: category.name || `Category ${categoryIndex + 1}`,
          description: category.description ?? '',
          items: category.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            price: Number(item.price),
            taxPercentage: Number(item.taxPercentage) || 0,
            tags: item.tags ?? [],
            isVeg: item.isVeg ?? null,
            isAvailable: item.isAvailable ?? true,
            addOnGroups: item.addOnGroups ?? []
          }))
        }))
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu(retailerId!) });
    }
  });

  const addCategory = () => setCategories((prev) => [...prev, { name: 'New category', description: '', items: [] }]);

  const openEditModal = (categoryIndex: number, itemIndex: number, item: EditableItem) => {
    setEditing({ categoryIndex, itemIndex, draft: cloneItem(item) });
  };

  const addItem = (categoryIndex: number) =>
    setCategories((prev) => {
      const next = prev.map((category, idx) =>
        idx === categoryIndex ? { ...category, items: [...category.items, emptyItem()] } : category
      );
      const itemIndex = next[categoryIndex].items.length - 1;
      setEditing({ categoryIndex, itemIndex, draft: cloneItem(next[categoryIndex].items[itemIndex]) });
      return next;
    });

  const updateCategoryField = (index: number, key: 'name' | 'description', value: string) =>
    setCategories((prev) => prev.map((cat, idx) => (idx === index ? { ...cat, [key]: value } : cat)));

  const removeItem = (categoryIndex: number, itemIndex: number) =>
    setCategories((prev) =>
      prev.map((category, idx) =>
        idx === categoryIndex
          ? { ...category, items: category.items.filter((_, i) => i !== itemIndex) }
          : category
      )
    );

  const removeCategory = (categoryIndex: number) =>
    setCategories((prev) => prev.filter((_, idx) => idx !== categoryIndex));

  const totalItems = useMemo(() => categories.reduce((acc, cat) => acc + cat.items.length, 0), [categories]);

  const updateDraftField = (key: keyof EditableItem, value: EditableItem[keyof EditableItem]) =>
    setEditing((prev) => (prev ? { ...prev, draft: { ...prev.draft, [key]: value } } : prev));

  const updateDraftAddOnGroupField = (groupIndex: number, key: 'name' | 'min' | 'max', value: string | number) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const groups = prev.draft.addOnGroups ?? [];
      const nextGroups = groups.map((group, idx) => (idx === groupIndex ? { ...group, [key]: value } : group));
      return { ...prev, draft: { ...prev.draft, addOnGroups: nextGroups } };
    });

  const updateDraftAddOnOptionField = (
    groupIndex: number,
    optionIndex: number,
    key: 'label' | 'price' | 'isDefault',
    value: string | number | boolean
  ) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const groups = prev.draft.addOnGroups ?? [];
      const nextGroups = groups.map((group, gIdx) =>
        gIdx === groupIndex
          ? {
              ...group,
              options: group.options.map((opt, oIdx) => (oIdx === optionIndex ? { ...opt, [key]: value } : opt))
            }
          : group
      );
      return { ...prev, draft: { ...prev.draft, addOnGroups: nextGroups } };
    });

  const addDraftAddOnGroup = () =>
    setEditing((prev) => {
      if (!prev) return prev;
      const groups = prev.draft.addOnGroups ?? [];
      return {
        ...prev,
        draft: {
          ...prev.draft,
          addOnGroups: [...groups, { id: undefined, name: 'Add-ons', min: 0, max: 1, options: [] }]
        }
      };
    });

  const addDraftAddOnOption = (groupIndex: number) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const groups = prev.draft.addOnGroups ?? [];
      const nextGroups = groups.map((group, idx) =>
        idx === groupIndex
          ? {
              ...group,
              options: [...(group.options ?? []), { id: undefined, label: 'Option', price: 0, isDefault: false }]
            }
          : group
      );
      return { ...prev, draft: { ...prev.draft, addOnGroups: nextGroups } };
    });

  const removeDraftAddOnGroup = (groupIndex: number) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const groups = prev.draft.addOnGroups ?? [];
      return { ...prev, draft: { ...prev.draft, addOnGroups: groups.filter((_, idx) => idx !== groupIndex) } };
    });

  const removeDraftAddOnOption = (groupIndex: number, optionIndex: number) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const groups = prev.draft.addOnGroups ?? [];
      const nextGroups = groups.map((group, gIdx) =>
        gIdx === groupIndex
          ? { ...group, options: group.options.filter((_, oIdx) => oIdx !== optionIndex) }
          : group
      );
      return { ...prev, draft: { ...prev.draft, addOnGroups: nextGroups } };
    });

  const handleSaveDraft = () => {
    if (!editing) return;
    setCategories((prev) =>
      prev.map((category, idx) =>
        idx === editing.categoryIndex
          ? {
              ...category,
              items: category.items.map((item, itemIdx) => (itemIdx === editing.itemIndex ? editing.draft : item))
            }
          : category
      )
    );
    setEditing(null);
  };

  if (!retailerId) {
    return <p className="text-sm text-slate-500">No retailer context found. Please re-login.</p>;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Restaurant menu</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Build categories and items customers see after scanning your QR. Save to publish.
        </p>
      </header>

      {isLoading ? <p className="text-sm text-slate-500">Loading menu...</p> : null}
      {error ? <p className="text-sm text-rose-500">{(error as Error).message}</p> : null}

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{categories.length} categories • {totalItems} items</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addCategory}
            className="rounded-md border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:border-slate-400 dark:border-white/20 dark:text-white"
          >
            Add category
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-md bg-[color:var(--green)] px-4 py-2 font-semibold text-slate-900 disabled:opacity-70"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save menu'}
          </button>
        </div>
      </div>

      {categories.length ? (
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => (
            <section
              key={categoryIndex}
              className="space-y-3 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-col gap-1">
                  <input
                    value={category.name}
                    onChange={(e) => updateCategoryField(categoryIndex, 'name', e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white"
                    placeholder="Category name"
                  />
                  <input
                    value={category.description ?? ''}
                    onChange={(e) => updateCategoryField(categoryIndex, 'description', e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addItem(categoryIndex)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 dark:border-white/15 dark:text-white"
                  >
                    + Item
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(categoryIndex)}
                    className="rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 dark:border-rose-500/60 dark:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name || 'Untitled item'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">SKU: {item.sku || '—'}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                          ₹{Number(item.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        Tax: {Number(item.taxPercentage || 0).toFixed(0)}% • {item.isAvailable ? 'Available' : 'Hidden'}
                      </p>
                      {item.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {item.addOnGroups?.length ? (
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          {item.addOnGroups.length} add-on group{item.addOnGroups.length > 1 ? 's' : ''}
                        </p>
                      ) : (
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">No add-ons</p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => openEditModal(categoryIndex, itemIndex, item)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 dark:border-white/20 dark:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(categoryIndex, itemIndex)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {!category.items.length && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/15 dark:text-slate-300">
                    No items yet. Add your first dish.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        !isLoading && <p className="text-sm text-slate-500">No menu found. Add a category to begin.</p>
      )}

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/15 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Edit item</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editing.draft.name || 'Untitled item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 dark:border-white/20 dark:text-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">Name</span>
                  <input
                    value={editing.draft.name}
                    onChange={(e) => updateDraftField('name', e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">SKU</span>
                  <input
                    value={editing.draft.sku}
                    onChange={(e) => updateDraftField('sku', e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                  />
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">Price (₹)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editing.draft.price}
                    onChange={(e) => updateDraftField('price', Number(e.target.value))}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">Tax %</span>
                  <input
                    type="number"
                    min={0}
                    max={28}
                    value={editing.draft.taxPercentage}
                    onChange={(e) => updateDraftField('taxPercentage', Number(e.target.value))}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">Tags (comma separated)</span>
                  <input
                    value={(editing.draft.tags ?? []).join(',')}
                    onChange={(e) =>
                      updateDraftField(
                        'tags',
                        e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                      )
                    }
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={editing.draft.isAvailable}
                    onChange={(e) => updateDraftField('isAvailable', e.target.checked)}
                  />
                  Available
                </label>
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={editing.draft.isVeg ?? false}
                    onChange={(e) => updateDraftField('isVeg', e.target.checked)}
                  />
                  Veg
                </label>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200/80 p-3 text-sm dark:border-white/15">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Add-on groups</p>
                  <button
                    type="button"
                    onClick={addDraftAddOnGroup}
                    className="text-[11px] font-semibold text-[color:var(--green)]"
                  >
                    + Group
                  </button>
                </div>
                {editing.draft.addOnGroups?.length ? (
                  <div className="space-y-2">
                    {editing.draft.addOnGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="rounded border border-slate-200 p-2 dark:border-white/15">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={group.name}
                            onChange={(e) => updateDraftAddOnGroupField(groupIndex, 'name', e.target.value)}
                            className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                            placeholder="Group name"
                          />
                          <input
                            type="number"
                            min={0}
                            value={group.min}
                            onChange={(e) => updateDraftAddOnGroupField(groupIndex, 'min', Number(e.target.value))}
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            min={1}
                            value={group.max}
                            onChange={(e) => updateDraftAddOnGroupField(groupIndex, 'max', Number(e.target.value))}
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                            placeholder="Max"
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftAddOnGroup(groupIndex)}
                            className="text-[11px] text-rose-500"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 space-y-1">
                          {group.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <input
                                value={option.label}
                                onChange={(e) =>
                                  updateDraftAddOnOptionField(groupIndex, optionIndex, 'label', e.target.value)
                                }
                                className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                                placeholder="Option label"
                              />
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={option.price}
                                onChange={(e) =>
                                  updateDraftAddOnOptionField(
                                    groupIndex,
                                    optionIndex,
                                    'price',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 rounded border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none dark:border-white/20 dark:bg-white/5 dark:text-white"
                              />
                              <label className="flex items-center gap-2 text-[11px] text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={option.isDefault}
                                  onChange={(e) =>
                                    updateDraftAddOnOptionField(groupIndex, optionIndex, 'isDefault', e.target.checked)
                                  }
                                />
                                Default
                              </label>
                              <button
                                type="button"
                                onClick={() => removeDraftAddOnOption(groupIndex, optionIndex)}
                                className="text-[11px] text-rose-500"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addDraftAddOnOption(groupIndex)}
                            className="text-[11px] font-semibold text-[color:var(--green)]"
                          >
                            + Option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No add-ons yet.</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 dark:border-white/20 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-md bg-[color:var(--green)] px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {saveMutation.error ? (
        <p className="text-sm text-rose-500">{(saveMutation.error as Error).message}</p>
      ) : null}
      {saveMutation.isSuccess ? <p className="text-sm text-green-600">Menu saved.</p> : null}
    </div>
  );
};

export default MenuPage;
