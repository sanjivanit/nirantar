import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { pool } from '../src/db.js';
import { loginToken, buildMultipartBody } from './helpers.js';

const HEADER = 'name,gstin,pan,bank_account,ifsc';

async function upload(
  app: ReturnType<typeof buildApp>,
  token: string,
  plantId: number,
  fileContent: string | Buffer,
  opts?: { filename?: string; fields?: Record<string, string> },
) {
  const { body, contentType } = buildMultipartBody(fileContent, opts);
  return app.inject({
    method: 'POST',
    url: `/api/plants/${plantId}/vendor-records/import`,
    headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
    payload: body,
  });
}

describe('vendor-records import', () => {
  let plantAId: number;
  let plantBId: number;
  let existingGstin: string;

  beforeAll(async () => {
    const plantA = await pool.query(
      `select p.id from public.plants p join public.companies c on c.id = p.company_id
       where c.name = 'Suryodaya Autocomponents Pvt Ltd' limit 1`,
    );
    plantAId = Number(plantA.rows[0].id);

    const plantB = await pool.query(
      `select id from public.plants where name = 'Company B Fixture Plant'`,
    );
    if (!plantB.rows[0]) {
      throw new Error('Company B fixture plant not found — run `npm run seed` first.');
    }
    plantBId = Number(plantB.rows[0].id);

    const gstinRow = await pool.query(
      `select primary_gstin from public.vendors where primary_gstin is not null limit 1`,
    );
    existingGstin = gstinRow.rows[0].primary_gstin;
  });

  it('imports a valid file: happy path', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const csv = [
      HEADER,
      'Test Vendor One,27AAAAA0000A1Z1,AAAAA0000A,XXXX1234,HDFC0001234',
      'Test Vendor Two,,BBBBB1111B,,',
    ].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.imported_count).toBe(2);
    expect(body.parse_errors).toEqual([]);
  });

  it('reports a row with missing name as a parse error, not an insert', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const csv = [HEADER, ',27AAAAA0000A1Z1,AAAAA0000A,,', 'Valid Row,,,,'].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.imported_count).toBe(1);
    expect(body.parse_errors).toHaveLength(1);
    expect(body.parse_errors[0]).toEqual({ row: 1, reason: 'missing required field: name' });
  });

  it('400s the whole file when the name column is missing entirely', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const csv = ['vendor,gstin,pan', 'Some Vendor,27AAAAA0000A1Z1,AAAAA0000A'].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toContain('missing required column');
  });

  it('marks a row with both gstin and pan empty as insufficient_data', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const csv = [HEADER, 'No Identifiers Vendor,,,,'].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.insufficient_data_count).toBe(1);
    expect(body.pending_review_count).toBe(0);
  });

  it('marks a row with only one of gstin/pan present as pending_match', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const csv = [HEADER, 'GSTIN Only Vendor,27AAAAA0000A1Z1,,,'].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.pending_review_count).toBe(1);
    expect(body.insufficient_data_count).toBe(0);
    expect(body.matched_count).toBe(0); // unreachable until duplicate-matching (Piece 4) exists
  });

  it('imports both rows when the same GSTIN appears twice in one file (no in-file dedup — that is Piece 4 duplicate-matching, not ingestion)', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    // Unique per test run — the DB persists across runs (this isn't a
    // reset-per-invocation test DB), so a fixed literal here would let
    // the count assertion below accumulate across repeated runs.
    const dupGstin = `27DUP${Date.now() % 100000}0A1Z1`;
    const csv = [HEADER, `Duplicate A,${dupGstin},,,`, `Duplicate B,${dupGstin},,,`].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(200);
    expect(r.json().imported_count).toBe(2);

    const rows = await pool.query(`select count(*) from public.vendor_records where raw_gstin = $1`, [
      dupGstin,
    ]);
    expect(Number(rows.rows[0].count)).toBe(2);
  });

  it('imports a row whose GSTIN already exists elsewhere in the DB without rejecting it', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const csv = [HEADER, `Reuses Existing GSTIN,${existingGstin},,,`].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(200);
    expect(r.json().imported_count).toBe(1);
  });

  it('400s on an empty file', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await upload(app, token, plantAId, '');
    expect(r.statusCode).toBe(400);
  });

  it('400s on a non-CSV (binary) upload instead of crashing', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0xff, 0xfe, 0x22, 0x22, 0x22]);
    const r = await upload(app, token, plantAId, binary, { filename: 'not-a-csv.png' });
    expect(r.statusCode).toBe(400);
  });

  it('400s on a file over the 5MB limit', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const oversized = Buffer.alloc(6 * 1024 * 1024, 'a');
    const r = await upload(app, token, plantAId, oversized);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toContain('MB limit');
  }, 20_000);

  it('400s when the row count exceeds the 5,000-row limit', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const rows = Array.from({ length: 5001 }, (_, i) => `Vendor ${i},,,,`);
    const csv = [HEADER, ...rows].join('\n');

    const r = await upload(app, token, plantAId, csv);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toContain('row limit');
  }, 20_000);

  it("404s (does not import) when Company A's token targets Company B's plant", async () => {
    const app = buildApp();
    const token = await loginToken(app); // rohan@suryodaya-auto.com — Company A
    const csv = [HEADER, 'Should Never Land Here,27SHOULDNOT0A1Z1,,,'].join('\n');

    const r = await upload(app, token, plantBId, csv);
    expect(r.statusCode).toBe(404);

    const leaked = await pool.query(
      `select count(*) from public.vendor_records where plant_id = $1 and raw_gstin = '27SHOULDNOT0A1Z1'`,
      [plantBId],
    );
    expect(Number(leaked.rows[0].count)).toBe(0);
  });
});
