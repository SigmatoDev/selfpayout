import { prisma } from '../../config/prisma';
import type { SubscriptionAssignInput, SubscriptionPlanInput } from './subscription.schema';

export const listPlans = () => prisma.subscriptionPlan.findMany({ orderBy: { createdAt: 'desc' } });

export const createPlan = (input: SubscriptionPlanInput) =>
  prisma.subscriptionPlan.create({ data: input });

export const updatePlan = (id: string, input: SubscriptionPlanInput) =>
  prisma.subscriptionPlan.update({ where: { id }, data: input });

export const assignPlan = async ({ planId, retailerId, startDate, endDate }: SubscriptionAssignInput) => {
  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { retailerId },
      update: {
        planId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: 'ACTIVE'
      },
      create: {
        planId,
        retailerId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        status: 'ACTIVE'
      }
    });

    await tx.retailer.update({
      where: { id: retailerId },
      data: { subscriptionPlanId: planId }
    });

    return subscription;
  });
};
