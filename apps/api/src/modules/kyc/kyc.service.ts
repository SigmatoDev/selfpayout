import { prisma } from '../../config/prisma';
import type { KycUpdateInput } from './kyc.schema';

export const listPendingKyc = (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING') =>
  prisma.kyc.findMany({
    where: status === 'ALL' ? undefined : { status },
    include: { retailer: true },
    orderBy: { createdAt: 'desc' }
  });

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
