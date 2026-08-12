import type { FastifyInstance } from 'fastify';

export async function loginToken(
  app: FastifyInstance,
  email = 'rohan@suryodaya-auto.com',
  password = 'nirantar123',
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  return res.json().token;
}

// Hand-builds a multipart/form-data body (fixed boundary) instead of pulling
// in another dependency just for tests — @fastify/multipart parses standard
// multipart wire format regardless of what built it.
export function buildMultipartBody(
  fileContent: string | Buffer,
  opts: { filename?: string; fieldName?: string; fields?: Record<string, string> } = {},
): { body: Buffer; contentType: string } {
  const boundary = '----niranTarTestBoundary';
  const filename = opts.filename ?? 'vendors.csv';
  const fieldName = opts.fieldName ?? 'file';
  const parts: Buffer[] = [];

  for (const [key, value] of Object.entries(opts.fields ?? {})) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: text/csv\r\n\r\n`,
    ),
    Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  );

  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}
