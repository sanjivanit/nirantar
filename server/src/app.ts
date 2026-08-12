import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.routes.js';
import { vendorsRoutes } from './routes/vendors.routes.js';
import { vendorRecordsRoutes } from './routes/vendor-records.routes.js';

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  });
  app.register(authRoutes);
  app.register(vendorsRoutes);
  app.register(vendorRecordsRoutes);

  return app;
}
