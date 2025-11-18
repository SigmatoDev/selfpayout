import { prisma } from '../../config/prisma';
import { resolveObjectUrl } from '../../lib/storage';
import type { KycUpdateInput } from './kyc.schema';

type KycDocuments = {
  aadhar?: KycDocumentEntry | null;
  pan?: KycDocumentEntry | null;
} | null;

type KycDocumentEntry = {
  number?: string;
  file?: {
    storageKey?: string;
    storageProvider?: string;
    location?: string;
    originalName?: string;
    contentType?: string;
    size?: number;
    url?: string;
    data?: string;
  };
};

const buildUrlFromLocation = (location?: string | null) => {
  if (!location) return undefined;
  const normalized = location.replace(/\\/g, '/');
  const marker = '/storage/';
  const index = normalized.lastIndexOf(marker);
  if (index !== -1) {
    const key = normalized.slice(index + marker.length);
    if (key) {
      return `${marker}${key}`;
    }
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return undefined;
};

const withDocumentUrls = (documents: KycDocuments): KycDocuments => {
  if (!documents) return documents;

  const mapEntry = (entry?: KycDocumentEntry | null) => {
    if (!entry) return entry;
    const file = entry.file;
    if (!file) return entry;

    let url = file.url;
    if (!url) {
      if (file.storageKey) {
        url = resolveObjectUrl(file.storageKey);
      } else if (file.data) {
        const contentType = file.contentType ?? 'application/octet-stream';
        url = `data:${contentType};base64,${file.data}`;
      } else {
        url = buildUrlFromLocation(file.location);
      }
    }

    return {
      ...entry,
      file: {
        ...file,
        url
      }
    };
  };

  return {
    aadhar: mapEntry(documents.aadhar),
    pan: mapEntry(documents.pan)
  };
};

export const listPendingKyc = (
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING',
  retailerId?: string
) =>
  prisma.kyc
    .findMany({
      where: {
        ...(status === 'ALL' ? {} : { status }),
        ...(retailerId ? { retailerId } : {})
      },
      include: { retailer: true },
      orderBy: { createdAt: 'desc' }
    })
    .then((records) =>
      records.map((record) => ({
        ...record,
        documents: withDocumentUrls(record.documents as KycDocuments)
      }))
    );

export const updateKycStatus = async ({ retailerId, status, comments }: KycUpdateInput) => {
  return prisma.$transaction(async (tx) => {
    const kyc = await tx.kyc.update({
      where: { retailerId },
      data: { status, reviewerComments: comments ?? null },
      include: { retailer: true }
    });

    if (status === 'APPROVED') {
      await tx.retailer.update({
        where: { id: retailerId },
        data: { status: 'ACTIVE' }
      });
    }

    if (status === 'REJECTED') {
      await tx.retailer.update({
        where: { id: retailerId },
        data: { status: 'PENDING_ONBOARDING' }
      });
    }

    return kyc;
  });
};
