import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { parseVendorCsv, CsvFileError, MAX_FILE_SIZE_BYTES, type ParsedRow } from '../vendor-import.js';

export async function vendorRecordsRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });

  app.addHook('preHandler', requireAuth);

  app.post<{ Params: { id: string } }>(
    '/api/plants/:id/vendor-records/import',
    async (req, reply) => {
      const { company_id } = req.user!;

      if (!/^\d+$/.test(req.params.id)) {
        return reply.code(400).send({ error: 'id must be a positive integer' });
      }
      const plantId = Number(req.params.id);

      // Tenant isolation: a plant id that exists but belongs to a
      // different company must 404, same as the vendor routes — never
      // reveal whether the id exists elsewhere, and never let an upload
      // land against another company's plant.
      const plantResult = await pool.query(
        `select id, company_id from public.plants where id = $1`,
        [plantId],
      );
      const plant = plantResult.rows[0];
      if (!plant || Number(plant.company_id) !== company_id) {
        return reply.code(404).send({ error: 'Plant not found' });
      }

      if (!req.isMultipart()) {
        return reply.code(400).send({ error: 'Expected a multipart/form-data file upload' });
      }

      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // @fastify/multipart throws (surfaced as a 413 by Fastify's default
      // error handler) once the configured fileSize limit is exceeded,
      // rather than truncating and letting us check a flag afterward.
      // Caught here so every validation failure on this route returns the
      // same { error } shape and status code family (400), not a mix of
      // framework-default error bodies.
      let buffer: Buffer;
      try {
        buffer = await file.toBuffer();
      } catch {
        return reply
          .code(400)
          .send({ error: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit` });
      }

      let sourceSystem: string | null = null;
      const sourceField = file.fields?.source_system;
      if (sourceField && !Array.isArray(sourceField) && sourceField.type === 'field') {
        sourceSystem = String(sourceField.value);
      }

      let parsed;
      try {
        parsed = parseVendorCsv(buffer);
      } catch (err) {
        if (err instanceof CsvFileError) {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }

      const client = await pool.connect();
      let matchedCount = 0;
      let pendingCount = 0;
      let insufficientCount = 0;
      try {
        await client.query('begin');
        for (const row of parsed.rows) {
          const status = importStatusFor(row);
          if (status === 'insufficient_data') insufficientCount++;
          else pendingCount++; // 'matched' is unreachable until duplicate-matching (Piece 4) exists

          await client.query(
            `insert into public.vendor_records
              (plant_id, source_system, raw_name, raw_gstin, raw_pan,
               raw_bank_account, raw_ifsc, import_status)
             values ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              plantId,
              sourceSystem,
              row.raw_name,
              row.raw_gstin,
              row.raw_pan,
              row.raw_bank_account,
              row.raw_ifsc,
              status,
            ],
          );
        }
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw err;
      } finally {
        client.release();
      }

      return reply.send({
        imported_count: parsed.rows.length,
        matched_count: matchedCount,
        pending_review_count: pendingCount,
        insufficient_data_count: insufficientCount,
        parse_errors: parsed.errors,
      });
    },
  );
}

// A row with neither identifier can't be checked or matched at all (spec.md
// §4: "if a vendor record comes in with no tax number and no PAN at all, we
// don't try to check it or match it"). Everything else becomes pending_match
// — 'matched' requires duplicate-matching logic (Piece 4) that doesn't exist
// yet, so it's correctly unreachable here, not a gap to work around.
function importStatusFor(row: ParsedRow): 'pending_match' | 'insufficient_data' {
  return row.raw_gstin || row.raw_pan ? 'pending_match' : 'insufficient_data';
}
