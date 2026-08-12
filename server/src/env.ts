import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load the single root .env (two levels above server/src/).
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../.env') });

function required(key: string): string {
  const v = process.env[key];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required env var: ${key} (check nirantar/.env)`);
  }
  return v;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  SETU_API_BASE_URL: required('SETU_API_BASE_URL'),
  SETU_CLIENT_ID: required('SETU_CLIENT_ID'),
  SETU_CLIENT_SECRET: required('SETU_CLIENT_SECRET'),
  SETU_GSTIN_PRODUCT_ID: required('SETU_GSTIN_PRODUCT_ID'),
  SETU_PENNY_DROP_PRODUCT_ID: required('SETU_PENNY_DROP_PRODUCT_ID'),
  JWT_SECRET: required('JWT_SECRET'),
  PORT: Number(process.env.PORT ?? 8787),
} as const;
