import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from '../src/db.js';

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here)
  .filter((f) => /^\d+.*\.sql$/.test(f))
  .sort();

for (const file of files) {
  const sql = readFileSync(resolve(here, file), 'utf8');
  await pool.query(sql);
  console.log(`migration applied: ${file}`);
}
await pool.end();
