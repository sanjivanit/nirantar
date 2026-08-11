import type { FastifyInstance } from 'fastify';

export async function loginToken(
  app: FastifyInstance,
  email = 'rohan@suryodaya-auto.com',
  password = 'nirantar123',
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  return res.json().token;
}
