"use client";

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { getAuthToken } from '../../../lib/auth';
import { queryKeys } from '../../../lib/query-keys';

interface ApiCollection<T> {
  data: T;
}

interface KycRecord {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerComments?: string | null;
  createdAt: string;
  retailer: {
    id: string;
    shopName: string;
    contactEmail: string;
    contactPhone: string;
  };
}

interface KycUpdatePayload {
  retailerId: string;
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const KycPage = () => {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' ? Boolean(getAuthToken()) : false;

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.kyc,
    queryFn: () => apiClient.get<ApiCollection<KycRecord[]>>('kyc?status=PENDING'),
    enabled: hasToken
  });

  useEffect(() => {
    if (hasToken) {
      refetch();
    }
  }, [hasToken, refetch]);

  const updateMutation = useMutation<ApiCollection<KycRecord>, Error, KycUpdatePayload>({
    mutationFn: (payload) => apiClient.post<ApiCollection<KycRecord>>('kyc/status', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kyc });
      queryClient.invalidateQueries({ queryKey: queryKeys.retailers });
    }
  });

  const handleDecision = (record: KycRecord, status: 'APPROVED' | 'REJECTED') => {
    if (updateMutation.isPending) return;
    let comments: string | undefined;

    if (status === 'REJECTED') {
      // eslint-disable-next-line no-alert
      const note = window.prompt('Add rejection comments (optional):');
      comments = note ?? undefined;
    }

    updateMutation.mutate({ retailerId: record.retailer.id, status, comments });
  };

  const records = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">KYC reviews</h1>
        <p className="text-sm text-slate-600">Verify retailer documents prior to activation.</p>
      </header>

      <section className="rounded-lg border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <table className="min-w-full divide-y divide-[color:var(--border)] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Retailer</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)] bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  Loading KYC submissions...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  Nothing pending right now.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{record.retailer.shopName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(record.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex flex-col">
                      <span>{record.retailer.contactEmail}</span>
                      <span className="text-xs text-slate-500">{record.retailer.contactPhone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">{record.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(record, 'APPROVED')}
                        disabled={updateMutation.isPending}
                        className="text-sm font-medium text-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(record, 'REJECTED')}
                        disabled={updateMutation.isPending}
                        className="text-sm text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default KycPage;
