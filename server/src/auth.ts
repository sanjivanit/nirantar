import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from './env.js';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  company_id: number;
  plant_id: number | null;
}

export interface TokenPayload {
  sub: number;
  email: string;
  role: string;
  company_id: number;
  plant_id: number | null;
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    plant_id: user.plant_id,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    return reply.code(401).send({ error: 'Missing bearer token' });
  }
  try {
    req.user = verifyToken(token);
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
