import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { pool } from '../src/db.js';
import { signToken } from '../src/auth.js';
import { loginToken, buildMultipartBody } from './helpers.js';

const HEADER = 'name,gstin,pan,bank_account,ifsc';

describe('vendor-records summary', () => {
  let plantAId: number;
  let companyBToken: string;

  beforeAll(async () => {
    const plantA = await pool.query(
      `select p.id from public.plants p join public.companies c on c.id = p.company_id
       where c.name = 'Suryodaya Autocomponents Pvt Ltd' limit 1`,
    );
    plantAId = Number(plantA.rows[0].id);

    // Company B never has any vendor_records inserted by any test (the
    // cross-tenant import test explicitly asserts nothing lands there) —
    // real zero-state data, not a mock. No real user exists for Company B
    // (only the tenant-isolation fixture: a company + a vendor), so a
    // token is minted directly rather than logging in — requireAuth only
    // validates the JWT itself, same approach the tenant-isolation tests
    // already rely on implicitly via company_id scoping in queries.
    const companyB = await pool.query(
      `select id from public.companies where name = 'Rival Autoparts Industries Pvt Ltd'`,
    );
    if (!companyB.rows[0]) {
      throw new Error('Company B fixture not found — run `npm run seed` first.');
    }
    companyBToken = signToken({
      id: 999999998,
      email: 'ghost-b@nowhere.com',
      name: 'Ghost B',
      role: 'cfo',
      company_id: Number(companyB.rows[0].id),
      plant_id: null,
    });
  });

  async function getSummary(app: ReturnType<typeof buildApp>, token: string) {
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendor-records/summary',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    return r.json() as { pending_match: number; matched: number; insufficient_data: number };
  }

  it('rejects the summary request without a token', async () => {
    const app = buildApp();
    const r = await app.inject({ method: 'GET', url: '/api/vendor-records/summary' });
    expect(r.statusCode).toBe(401);
  });

  it('returns all-zero counts for a company with no vendor_records at all', async () => {
    const app = buildApp();
    const summary = await getSummary(app, companyBToken);
    expect(summary).toEqual({ pending_match: 0, matched: 0, insufficient_data: 0 });
  });

  it('reflects exactly the rows just imported, per status (delta check — the DB is not reset between test runs)', async () => {
    const app = buildApp();
    const token = await loginToken(app); // Company A

    const before = await getSummary(app, token);

    const digits = String(Date.now() % 10000).padStart(4, '0');
    const csv = [
      HEADER,
      `Summary Test Pending A,27SUMRY${digits}F1Z5,,,`,
      `Summary Test Pending B,,BBBBB${digits}B,,`, // pan only -> also pending_match
      `Summary Test Insufficient,,,,`, // neither identifier -> insufficient_data
    ].join('\n');
    const { body, contentType } = buildMultipartBody(csv);
    const uploadRes = await app.inject({
      method: 'POST',
      url: `/api/plants/${plantAId}/vendor-records/import`,
      headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
      payload: body,
    });
    expect(uploadRes.statusCode).toBe(200);
    expect(uploadRes.json().pending_review_count).toBe(2);
    expect(uploadRes.json().insufficient_data_count).toBe(1);

    const after = await getSummary(app, token);
    expect(after.pending_match - before.pending_match).toBe(2);
    expect(after.insufficient_data - before.insufficient_data).toBe(1);
    // Company A's `matched` count isn't 0 overall — the original 14 seeded
    // vendors each have a 'matched' vendor_records row from db/seed.ts
    // directly (they're already-resolved seed data). What must be true is
    // that *this import* didn't add to it, since the ingestion endpoint
    // never sets 'matched' — that requires duplicate-matching (Piece 4),
    // which doesn't exist.
    expect(after.matched - before.matched).toBe(0);
  });

  it("does not include Company A's counts in Company B's summary (tenant isolation)", async () => {
    const app = buildApp();
    const tokenA = await loginToken(app);

    const before = await getSummary(app, companyBToken);

    // Import a fresh row for Company A — Company B's summary must not move.
    const digits = String(Date.now() % 10000).padStart(4, '0');
    const csv = [HEADER, `Isolation Check Vendor,27ISOLT${digits}F1Z5,,,`].join('\n');
    const { body, contentType } = buildMultipartBody(csv);
    const uploadRes = await app.inject({
      method: 'POST',
      url: `/api/plants/${plantAId}/vendor-records/import`,
      headers: { authorization: `Bearer ${tokenA}`, 'content-type': contentType },
      payload: body,
    });
    expect(uploadRes.statusCode).toBe(200);

    const after = await getSummary(app, companyBToken);
    expect(after).toEqual(before);
  });
});
