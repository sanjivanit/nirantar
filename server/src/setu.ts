import { env } from './env.js';

export interface GstResult {
  ok: boolean;
  verification: string | null;
  raw: unknown;
}

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Verify a GSTIN against Setu's Data Gateway. Base URL is env-driven
 * (SETU_API_BASE_URL) rather than hardcoded, since sandbox
 * (dg-sandbox.setu.co) and production (dg.setu.co) are different hosts
 * with different credentials — using the sandbox host in production
 * silently returns sandbox-only test results for real GSTINs.
 * A 200 response with { verification: 'success' } means verified.
 *
 * A timeout or network failure (Setu unreachable, DNS failure, connection
 * reset, etc.) returns the same { ok: false, verification: null, raw: null }
 * shape already produced above for a non-200/unparseable response — the
 * caller (vendors.routes.ts) already turns that into a clean "failed"
 * result via `result.verification ?? 'failed'`. Without this, an unhandled
 * fetch rejection would propagate as an uncaught 500 instead of the clear
 * "couldn't check" result the spec requires (spec.md §4: "if the outside
 * source can't be reached... it never quietly marks the new value as
 * confirmed").
 */
export async function verifyGst(gstin: string): Promise<GstResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${env.SETU_API_BASE_URL}/api/verify/gst`, {
      method: 'POST',
      headers: {
        'x-client-id': env.SETU_CLIENT_ID,
        'x-client-secret': env.SETU_CLIENT_SECRET,
        'x-product-instance-id': env.SETU_GSTIN_PRODUCT_ID,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ gstin }),
      signal: controller.signal,
    });
    const raw = await res.json().catch(() => null);
    const verification =
      raw && typeof raw === 'object' && 'verification' in raw
        ? String((raw as Record<string, unknown>).verification)
        : null;
    return { ok: res.status === 200 && verification === 'success', verification, raw };
  } catch {
    return { ok: false, verification: null, raw: null };
  } finally {
    clearTimeout(timeout);
  }
}
