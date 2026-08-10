import { describe, it, expect } from 'vitest';
import { verifyGst } from '../src/setu.js';

// Live sandbox smoke test. Only runs when RUN_LIVE=1 so CI without creds stays green.
describe.runIf(process.env.RUN_LIVE === '1')('setu live', () => {
  it('verifies a known sandbox GSTIN', async () => {
    const r = await verifyGst('29AAICP2912R1ZS');
    expect(r.ok).toBe(true);
  }, 30_000);
});
