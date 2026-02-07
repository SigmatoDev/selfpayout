'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  balanceAmount: number;
}

interface ApiCollection<T> {
  data: T;
}

interface CustomerPayload {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => apiClient.get<ApiCollection<Customer[]>>('customers')
  });

  const addCustomerMutation = useMutation<ApiCollection<Customer>, Error, CustomerPayload>({
    mutationFn: (payload) => apiClient.post<ApiCollection<Customer>>('customers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      setIsAdding(false);
    }
  });

  const customers: Customer[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customer ledger</h2>
        <button
          onClick={() => setIsAdding((prev) => !prev)}
          className="rounded-lg bg-[color:var(--green)] px-3 py-2 text-xs font-semibold text-slate-900"
        >
          {isAdding ? 'Cancel' : 'Add customer'}
        </button>
      </header>

      {isAdding ? <AddCustomerForm isSubmitting={addCustomerMutation.isPending} onSubmit={(values) => addCustomerMutation.mutate(values)} error={addCustomerMutation.error?.message} /> : null}

      <div className="rounded-2xl bg-white/10 p-4 shadow-lg">
        <ul className="space-y-3 text-sm">
          {isLoading ? (
            <li className="rounded-xl bg-black/30 px-3 py-3 text-center text-slate-400">Loading customers...</li>
          ) : customers.length === 0 ? (
            <li className="rounded-xl bg-black/30 px-3 py-3 text-center text-slate-400">No customers yet.</li>
          ) : (
            customers.map((customer) => {
              const displayName = customer.name?.trim() ? customer.name : 'Unknown';
              const displayPhone = customer.phone?.trim() ? customer.phone : '—';
              return (
                <li key={customer.id} className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-3">
                  <div>
                    <p className="font-medium text-white">{displayName}</p>
                    <p className="text-xs text-slate-400">{displayPhone}</p>
                    {customer.email ? <p className="text-xs text-slate-500">{customer.email}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className={`text-sm font-semibold ${customer.balanceAmount > 0 ? 'text-yellow-300' : 'text-[color:var(--green)]'}`}>
                      {customer.balanceAmount > 0 ? `₹${customer.balanceAmount}` : 'Settled'}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
};

const AddCustomerForm = ({
  onSubmit,
  isSubmitting,
  error
}: {
  onSubmit: (payload: CustomerPayload) => void;
  isSubmitting: boolean;
  error?: string;
}) => {
  const [formState, setFormState] = useState<CustomerPayload>({ name: '', phone: '', email: '' });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name: formState.name,
      phone: formState.phone,
      email: formState.email || undefined
    });
    setFormState({ name: '', phone: '', email: '' });
  };

  return (
    <form className="space-y-3 rounded-2xl bg-black/40 p-4 text-sm" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-slate-200">
          Name
          <input
            required
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-200">
          Phone
          <input
            required
            value={formState.phone}
            onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
            className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-slate-200">
        Email
        <input
          type="email"
          value={formState.email}
          onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
          className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none"
          placeholder="Optional"
        />
      </label>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-[color:var(--green)] px-4 py-2 text-xs font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Saving...' : 'Save customer'}
      </button>
    </form>
  );
};

export default CustomersPage;
