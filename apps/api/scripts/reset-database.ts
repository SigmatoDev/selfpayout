import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const run = async () => {
  try {
    console.log('Dropping public schema…');
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
    console.log('Recreating public schema…');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public');
    console.log('Database schema reset successfully.');
  } catch (error) {
    console.error('Failed to reset database schema:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

run();
