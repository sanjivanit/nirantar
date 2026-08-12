import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyGst } from '../src/setu.js';

// Live sandbox smoke test. Only runs when RUN_LIVE=1 so CI without creds stays green.
describe.runIf(process.env.RUN_LIVE === '1')('setu live', () => {
  it('verifies a known sandbox GSTIN', async () => {
    const r = await verifyGst('29AAICP2912R1ZS');
    expect(r.ok).toBe(true);
  }, 30_000);
});

// These don't touch the network — fetch is mocked — so they run in every
// test invocation, not just RUN_LIVE=1.
describe('setu failure handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns a clean failed result instead of crashing when the request times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      }),
    );

    const resultPromise = verifyGst('27AAFCB1234F1Z5');
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await resultPromise;

    expect(result).toEqual({ ok: false, verification: null, raw: null });
  });

  it('returns a clean failed result instead of crashing on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const result = await verifyGst('27AAFCB1234F1Z5');

    expect(result).toEqual({ ok: false, verification: null, raw: null });
  });
});
