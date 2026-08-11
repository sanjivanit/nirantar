import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  // Supabase requires TLS; the direct connection presents a cert we don't pin here.
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10_000,
});

// pg emits 'error' on the pool when an idle client's connection drops (e.g.
// a network blip). Node's default behavior for an unhandled EventEmitter
// 'error' event is to crash the whole process — this happened for real on
// 2026-08-11, taking the entire API down until someone noticed and
// restarted it. Logging instead lets the pool recover the next query.
pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});
