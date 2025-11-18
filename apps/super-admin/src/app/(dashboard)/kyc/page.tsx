"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { getAuthToken } from '../../../lib/auth';
import { queryKeys } from '../../../lib/query-keys';

interface ApiCollection<T> {
  data: T;
}

interface KycDocument {
  number?: string;
  file?: {
    url?: string;
    originalName?: string;
    contentType?: string;
    size?: number;
    location?: string;
    storageProvider?: string;
  } | null;
}

interface KycRecord {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerComments?: string | null;
  createdAt: string;
  documents?: {
    aadhar?: KycDocument | null;
    pan?: KycDocument | null;
  } | null;
  retailer: {
    id: string;
    shopName: string;
    contactEmail: string;
    contactPhone: string;
    address?: string | null;
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
                <Link
                  href={`/kyc/${record.retailer.id}`}
                  className="text-sm text-slate-600 underline-offset-2 hover:underline"
                >
                  View details
                </Link>
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

const formatFileSize = (value?: number | null) => {
  if (!value) return null;
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(value / 1024).toFixed(1)} KB`;
};

const KycDetailsModal = ({
  record,
  onClose,
  onApprove,
  onReject,
  isProcessing
}: {
  record: KycRecord;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) => {
  const renderDocCard = (label: string, doc?: KycDocument | null) => {
    if (!doc) {
      return (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] p-4 text-sm text-slate-500">
          No {label} provided.
        </div>
      );
    }

    const file = doc.file;
    const isImage = Boolean(file?.contentType?.startsWith('image'));
    const fileUrl = file?.url ?? file?.location ?? undefined;
    const formattedSize = formatFileSize(file?.size);

    return (
      <div className="space-y-3 rounded-lg border border-[color:var(--border)] bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            {doc.number ? <p className="text-xs text-slate-500">Number: {doc.number}</p> : null}
          </div>
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[color:var(--primary)]"
            >
              Open file
            </a>
          ) : null}
        </div>
        {fileUrl ? (
          isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={`${label} document`}
              className="h-60 w-full rounded-md border border-[color:var(--border)] object-contain"
            />
          ) : (
            <div className="rounded-md border border-dashed border-[color:var(--border)] bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Preview unavailable. Use the link above to view the file.
            </div>
          )
        ) : (
          <p className="text-xs text-slate-500">Document file missing.</p>
        )}
        <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500">
          {file?.originalName ? (
            <>
              <dt>Filename</dt>
              <dd className="font-medium text-slate-700">{file.originalName}</dd>
            </>
          ) : null}
          {file?.contentType ? (
            <>
              <dt>Type</dt>
              <dd className="font-medium text-slate-700">{file.contentType}</dd>
            </>
          ) : null}
          {formattedSize ? (
            <>
              <dt>Size</dt>
              <dd className="font-medium text-slate-700">{formattedSize}</dd>
            </>
          ) : null}
          {file?.storageProvider ? (
            <>
              <dt>Storage</dt>
              <dd className="font-medium text-slate-700">{file.storageProvider}</dd>
            </>
          ) : null}
        </dl>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">KYC review</p>
            <h2 className="text-2xl font-semibold text-slate-900">{record.retailer.shopName}</h2>
            <p className="text-sm text-slate-500">
              Submitted on {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--border)] bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Contact</p>
            <p className="text-sm text-slate-600">{record.retailer.contactEmail}</p>
            <p className="text-sm text-slate-600">{record.retailer.contactPhone}</p>
            {record.retailer.address ? (
              <p className="mt-2 text-xs text-slate-500">{record.retailer.address}</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-[color:var(--border)] bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Status</p>
            <p className="text-sm capitalize text-slate-600">{record.status.toLowerCase()}</p>
            {record.reviewerComments ? (
              <p className="mt-2 text-xs text-slate-500">Notes: {record.reviewerComments}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {renderDocCard('Aadhaar', record.documents?.aadhar)}
          {renderDocCard('PAN', record.documents?.pan)}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onApprove}
            disabled={isProcessing}
            className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isProcessing}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};
