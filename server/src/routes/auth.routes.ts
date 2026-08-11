import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { requireAuth, signToken, verifyPassword, type AuthUser } from '../auth.js';

interface LoginBody {
  email: string;
  password: string;
}

// pg returns bigint/bigserial columns as strings; coerce to number to match AuthUser.
function toSafeUser(row: Record<string, unknown>): AuthUser {
  return {
    id: Number(row.id),
    email: row.email as string,
    name: row.name as string,
    role: row.role as string,
    company_id: Number(row.company_id),
    plant_id: row.plant_id === null ? null : Number(row.plant_id),
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password are required' });
    }

    const result = await pool.query(
      `select id, email, name, role, company_id, plant_id, password_hash
       from public.users where email = $1`,
      [email],
    );
    const row = result.rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const user = toSafeUser(row);
    const token = signToken(user);
    return reply.send({ token, user });
  });

  app.get('/api/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const claims = req.user!;
    const result = await pool.query(
      `select id, email, name, role, company_id, plant_id from public.users where id = $1`,
      [claims.sub],
    );
    const row = result.rows[0];
    if (!row) {
      return reply.code(401).send({ error: 'User no longer exists' });
    }
    return reply.send({ user: toSafeUser(row) });
  });
}
