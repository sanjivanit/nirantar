import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app.js';
import { signToken } from '../src/auth.js';
import { env } from '../src/env.js';

describe('auth', () => {
  it('rejects bad password', async () => {
    const app = buildApp();
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'rohan@suryodaya-auto.com', password: 'nope' },
    });
    expect(r.statusCode).toBe(401);
  });

  it('rejects a nonexistent email (distinct code path from wrong password)', async () => {
    const app = buildApp();
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@nowhere.com', password: 'whatever' },
    });
    expect(r.statusCode).toBe(401);
    expect(r.json().error).toBe('Invalid email or password');
  });

  it.each([{ email: 'rohan@suryodaya-auto.com' }, { password: 'nirantar123' }, {}])(
    '400s when a required field is missing (%j)',
    async (payload) => {
      const app = buildApp();
      const r = await app.inject({ method: 'POST', url: '/api/auth/login', payload });
      expect(r.statusCode).toBe(400);
    },
  );

  it('400s for a malformed JSON body', async () => {
    const app = buildApp();
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{not valid json',
    });
    expect(r.statusCode).toBe(400);
  });

  it('logs in and /me works', async () => {
    const app = buildApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'rohan@suryodaya-auto.com', password: 'nirantar123' },
    });
    expect(login.statusCode).toBe(200);
    const { token } = login.json();

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.role).toBe('cfo');
  });

  it('rejects /me without a token', async () => {
    const app = buildApp();
    const r = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(r.statusCode).toBe(401);
  });

  it('rejects /me with a garbage/invalid token', async () => {
    const app = buildApp();
    const r = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer garbage.token.value' },
    });
    expect(r.statusCode).toBe(401);
    expect(r.json().error).toBe('Invalid or expired token');
  });

  it('rejects /me with an expired token', async () => {
    const app = buildApp();
    const expired = jwt.sign(
      { sub: 2, email: 'rohan@suryodaya-auto.com', role: 'cfo', company_id: 1, plant_id: null },
      env.JWT_SECRET,
      { expiresIn: -1 }, // already expired the instant it's signed
    );
    const r = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(r.statusCode).toBe(401);
    expect(r.json().error).toBe('Invalid or expired token');
  });

  it('rejects /me when the token is valid but the user no longer exists', async () => {
    const app = buildApp();
    const tokenForDeletedUser = signToken({
      id: 999999999,
      email: 'ghost@nowhere.com',
      name: 'Ghost',
      role: 'cfo',
      company_id: 1,
      plant_id: null,
    });
    const r = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${tokenForDeletedUser}` },
    });
    expect(r.statusCode).toBe(401);
    expect(r.json().error).toBe('User no longer exists');
  });
});
