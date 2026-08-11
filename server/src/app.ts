import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.routes.js';
import { vendorsRoutes } from './routes/vendors.routes.js';

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  });
  app.register(authRoutes);
  app.register(vendorsRoutes);

  return app;
}

const app = buildApp();

export default async function handler(req: any, res: any) {
  await app.ready();
  app.server.emit('request', req, res);
}