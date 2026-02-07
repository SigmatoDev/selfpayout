import { prisma } from '../src/config/prisma.js';

const RETAILER_CODE_PREFIX = 'RET';
const RETAILER_CODE_PAD = 4;

const parseRetailerCode = (code: string | null) => {
  if (!code) {
    return null;
  }

  const match = new RegExp(`^${RETAILER_CODE_PREFIX}(\\d+)$`).exec(code);
  if (!match) {
    return null;
  }

  return Number(match[1]);
};

const run = async () => {
  const retailers = await prisma.retailer.findMany({
    select: { id: true, retailerCode: true, createdAt: true }
  });

  if (retailers.length === 0) {
    console.log('No retailers found.');
    return;
  }

  let maxValue = 0;
  const missingCodes = retailers.filter((retailer) => {
    const parsed = parseRetailerCode(retailer.retailerCode);
    if (parsed) {
      maxValue = Math.max(maxValue, parsed);
      return false;
    }
    return true;
  });

  if (missingCodes.length === 0) {
    console.log('All retailers already have RET codes.');
    await prisma.sequence.upsert({
      where: { key: 'retailer' },
      create: { key: 'retailer', value: maxValue },
      update: { value: maxValue }
    });
    return;
  }

  const sortedMissing = missingCodes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const retailer of sortedMissing) {
    maxValue += 1;
    const retailerCode = `${RETAILER_CODE_PREFIX}${String(maxValue).padStart(RETAILER_CODE_PAD, '0')}`;
    await prisma.retailer.update({
      where: { id: retailer.id },
      data: { retailerCode }
    });
  }

  await prisma.sequence.upsert({
    where: { key: 'retailer' },
    create: { key: 'retailer', value: maxValue },
    update: { value: maxValue }
  });

  console.log(`Backfilled retailerCode for ${sortedMissing.length} retailer(s).`);
};

run()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
