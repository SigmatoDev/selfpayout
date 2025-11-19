import { config as loadEnv } from 'dotenv';
import path from 'path';
import { Client } from 'pg';
import { spawn } from 'node:child_process';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set, cannot recover migration.');
  process.exit(1);
}

const DROP_INDEX_SQL = 'DROP INDEX IF EXISTS "Payment_referenceId_key";';

async function dropDuplicateIndex() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(DROP_INDEX_SQL);
    console.log('Dropped duplicate Payment_referenceId_key index (if it existed).');
  } finally {
    await client.end();
  }
}

function runCommand(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false });
    child.on('exit', (code) => (code === 0 ? resolve(true) : reject(code)));
  });
}

async function recoverMigration() {
  await dropDuplicateIndex();
  await runCommand('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', '20251027050342_27']);
  await runCommand('npx', ['prisma', 'migrate', 'deploy']);
}

recoverMigration().catch((error) => {
  console.error('Migration recovery failed:', error);
  process.exit(1);
});
