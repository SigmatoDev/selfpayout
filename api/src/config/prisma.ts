import pkg from '@prisma/client';

import { env, isProduction } from './env';

const { PrismaClient } = pkg;

const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['query', 'error', 'warn']
});

export { prisma };
export const connectDatabase = async () => {
  await prisma.$connect();
};
