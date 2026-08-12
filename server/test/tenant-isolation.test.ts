import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { pool } from '../src/db.js';
import { loginToken } from './helpers.js';

// PRD's top-stated security requirement (spec.md §3): "every single request
// only ever sees the one company it belongs to... checked on the server,
// not just hidden on the screen." This was previously untested — the
// seed data only ever had one company, so there was nothing to actually
// prove isolation against. db/seed.ts now creates a second, unrelated
// company + vendor (id looked up dynamically here, not hardcoded, so this
// stays correct if the fixture or seed order ever changes).
describe('tenant isolation', () => {
  let companyBVendorId: number;

  beforeAll(async () => {
    const r = await pool.query(
      `select id from public.vendors where legal_name = 'Rival Test Vendor (Company B fixture)'`,
    );
    if (!r.rows[0]) {
      throw new Error(
        'Company B fixture vendor not found — run `npm run seed` to populate it before running this test.',
      );
    }
    companyBVendorId = Number(r.rows[0].id);
  });

  it("does not include Company B's vendor in Company A's vendor list", async () => {
    const app = buildApp();
    const token = await loginToken(app); // rohan@suryodaya-auto.com — Company A
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    const ids = r.json().map((v: { id: number }) => v.id);
    expect(ids).not.toContain(companyBVendorId);
  });

  it("404s (not 200 with data) when Company A's token requests Company B's vendor by id", async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: `/api/vendors/${companyBVendorId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(404);
  });

  it("404s (does not verify) when Company A's token tries to verify Company B's vendor", async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'POST',
      url: `/api/vendors/${companyBVendorId}/verify`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(404);
  });
});
