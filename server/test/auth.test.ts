import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

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
});
