import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import { loginToken } from './helpers.js';
import { pool } from '../src/db.js';

describe('vendors', () => {
  it('rejects list without a token', async () => {
    const app = buildApp();
    const r = await app.inject({ method: 'GET', url: '/api/vendors' });
    expect(r.statusCode).toBe(401);
  });

  it('lists vendors when authed', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().length).toBe(14);
  });

  it('returns a known vendor by id', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors/1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.legal_name).toBe('Shree Balaji Fasteners');
    expect(Array.isArray(body.verification_attributes)).toBe(true);
  });

  it('404s for a vendor that does not exist', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors/999999',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(404);
  });

  it.each(['abc', '12.5', '-1', '1e5'])(
    '400s instead of erroring for a non-numeric id (%s)',
    async (badId) => {
      const app = buildApp();
      const token = await loginToken(app);
      const r = await app.inject({
        method: 'GET',
        url: `/api/vendors/${encodeURIComponent(badId)}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(r.statusCode).toBe(400);
    },
  );

  it('400s for a non-numeric plant_id instead of letting NaN reach SQL', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors?plant_id=abc',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(400);
  });

  it('returns all six verification attributes and a changes array', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors/1',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = r.json();
    const types = body.verification_attributes.map((a: { attribute_type: string }) => a.attribute_type).sort();
    expect(types).toEqual([
      'bank_account', 'gstin_status', 'legal_name_match',
      'pan_status', 'registered_address', 'udyam_status',
    ]);
    expect(body.registered_address).toBeTruthy();
    expect(Array.isArray(body.changes)).toBe(true);
  });

  it('returns an empty array (not an error) when a search matches nothing', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'GET',
      url: '/api/vendors?q=zzz_no_such_vendor_will_ever_match_xyz',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual([]);
  });

  it('404s on verify for a vendor that does not exist', async () => {
    const app = buildApp();
    const token = await loginToken(app);
    const r = await app.inject({
      method: 'POST',
      url: '/api/vendors/999999/verify',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(404);
  });

  it('returns a failed result without calling Setu when the vendor has no primary_gstin', async () => {
    const app = buildApp();
    const token = await loginToken(app);

    // Vendor 2 (Anand Precision Tools) always has a GSTIN in the seed data —
    // temporarily null it out to exercise the early-return branch, then
    // restore it so this test doesn't corrupt state for any other test or
    // a later run in the same session.
    const original = await pool.query('select primary_gstin from public.vendors where id = 2');
    try {
      await pool.query('update public.vendors set primary_gstin = null where id = 2');
      const r = await app.inject({
        method: 'POST',
        url: '/api/vendors/2/verify',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(r.statusCode).toBe(200);
      expect(r.json().verification).toBe('failed');
    } finally {
      await pool.query('update public.vendors set primary_gstin = $1 where id = 2', [
        original.rows[0].primary_gstin,
      ]);
    }
  });

  describe.runIf(process.env.RUN_LIVE === '1')('re-verify', () => {
    it('writes the actual GSTIN into value, not the Setu status flag', async () => {
      const app = buildApp();
      const token = await loginToken(app);
      const r = await app.inject({
        method: 'POST',
        url: '/api/vendors/1/verify',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(r.statusCode).toBe(200);

      const detail = await app.inject({
        method: 'GET',
        url: '/api/vendors/1',
        headers: { authorization: `Bearer ${token}` },
      });
      const gstinAttr = detail.json().verification_attributes.find(
        (a: { attribute_type: string }) => a.attribute_type === 'gstin_status',
      );
      expect(gstinAttr.value).toBe('27AAFCB1234F1Z5');
      expect(gstinAttr.value).not.toBe('success');
    });
  });
});
