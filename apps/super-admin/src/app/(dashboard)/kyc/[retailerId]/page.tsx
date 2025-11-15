"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../../../../lib/api-client";
import { queryKeys } from "../../../../lib/query-keys";

interface ApiCollection<T> {
  data: T;
}

interface KycRecord {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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

interface KycDocument {
  number?: string;
  file?: {
    url?: string;
    originalName?: string;
    contentType?: string;
    size?: number;
    storageProvider?: string;
  } | null;
}

const formatFileSize = (value?: number | null) => {
  if (!value) return null;
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(value / 1024).toFixed(1)} KB`;
};

const DocumentCard = ({ label, doc }: { label: string; doc?: KycDocument | null }) => {
  if (!doc) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--border)] p-4 text-sm text-slate-500">
        No {label} document.
      </div>
    );
  }

  const file = doc.file;
  const isImage = Boolean(file?.contentType?.startsWith("image"));
  const fileUrl = file?.url;
  const fileSize = formatFileSize(file?.size);

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
            Open
          </a>
        ) : null}
      </div>
      {fileUrl ? (
        isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={`${label} document`}
            className="h-64 w-full rounded-md border border-[color:var(--border)] object-contain"
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
        {fileSize ? (
          <>
            <dt>Size</dt>
            <dd className="font-medium text-slate-700">{fileSize}</dd>
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

const KycDetailPage = ({ params }: { params: { retailerId: string } }) => {
  const { retailerId } = params;
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...queryKeys.kyc, retailerId],
    queryFn: () => apiClient.get<ApiCollection<KycRecord[]>>(`kyc?status=ALL&retailerId=${retailerId}`),
    enabled: Boolean(retailerId),
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (!retailerId) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Loading KYC record...</p>
      </div>
    );
  }

  const record = data?.data?.[0];
  if (!record) {
    return (
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">KYC details</h1>
            <p className="text-sm text-slate-500">No KYC record found for this retailer.</p>
          </div>
          <Link href="/kyc" className="text-sm font-medium text-[color:var(--primary)]">
            Back to KYC reviews
          </Link>
        </header>
        <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-white/70 p-6 text-sm text-slate-500">
          No details available. This retailer may not have submitted an application.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">KYC review</p>
          <h1 className="text-3xl font-semibold text-slate-900">{record.retailer.shopName}</h1>
          <p className="text-sm text-slate-500">Submitted on {new Date(record.createdAt).toLocaleString()}</p>
        </div>
        <Link
          href="/kyc"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[color:var(--primary)] shadow"
        >
          Back to reviews
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Contact</p>
          <p className="text-sm text-slate-600">{record.retailer.contactEmail}</p>
          <p className="text-sm text-slate-600">{record.retailer.contactPhone}</p>
          {record.retailer.address ? <p className="mt-2 text-xs text-slate-500">{record.retailer.address}</p> : null}
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Status</p>
          <p className="text-sm capitalize text-slate-600">{record.status.toLowerCase()}</p>
          {record.reviewerComments ? <p className="mt-2 text-xs text-slate-500">Notes: {record.reviewerComments}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DocumentCard label="Aadhaar" doc={record.documents?.aadhar} />
        <DocumentCard label="PAN" doc={record.documents?.pan} />
      </section>
    </div>
  );
};

export default KycDetailPage;
