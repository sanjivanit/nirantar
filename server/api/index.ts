import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/app.js';

// Vercel serverless entry point. src/index.ts's app.listen() only makes
// sense for a long-running process (local dev, or a traditional host) — a
// serverless function never listens on a port, it just gets invoked per
// request. Fastify still needs to run its own startup (route registration,
// plugin loading) via app.ready() before it can handle anything, so that's
// done once at module load and awaited on every invocation. Built outside
// the handler (not per-invocation) so a warm function reuses the same app
// instance and DB pool across requests instead of rebuilding them each time.
const app = buildApp();
const ready = app.ready();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;
  app.server.emit('request', req, res);
}
