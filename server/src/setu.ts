import { env } from './env.js';

export interface GstResult {
  ok: boolean;
  verification: string | null;
  raw: unknown;
}

/**
 * Verify a GSTIN against Setu's Data Gateway. Base URL is env-driven
 * (SETU_API_BASE_URL) rather than hardcoded, since sandbox
 * (dg-sandbox.setu.co) and production (dg.setu.co) are different hosts
 * with different credentials — using the sandbox host in production
 * silently returns sandbox-only test results for real GSTINs.
 * A 200 response with { verification: 'success' } means verified.
 */
export async function verifyGst(gstin: string): Promise<GstResult> {
  const res = await fetch(`${env.SETU_API_BASE_URL}/api/verify/gst`, {
    method: 'POST',
    headers: {
      'x-client-id': env.SETU_CLIENT_ID,
      'x-client-secret': env.SETU_CLIENT_SECRET,
      'x-product-instance-id': env.SETU_GSTIN_PRODUCT_ID,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ gstin }),
  });
  const raw = await res.json().catch(() => null);
  const verification =
    raw && typeof raw === 'object' && 'verification' in raw
      ? String((raw as Record<string, unknown>).verification)
      : null;
  return { ok: res.status === 200 && verification === 'success', verification, raw };
}
