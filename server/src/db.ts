import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  // Supabase requires TLS; the direct connection presents a cert we don't pin here.
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10_000,
});
