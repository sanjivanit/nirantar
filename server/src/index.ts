import { buildApp } from './app.js';
import { env } from './env.js';

const app = buildApp();

app
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .then((address) => {
    console.log(`nirantar server listening at ${address}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
