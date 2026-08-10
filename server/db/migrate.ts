import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from '../src/db.js';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(here, '001_init.sql'), 'utf8');

await pool.query(sql);
console.log('migration applied: 001_init.sql');
await pool.end();
