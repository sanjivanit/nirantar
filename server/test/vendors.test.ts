import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';
import { loginToken } from './helpers.js';

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
});
