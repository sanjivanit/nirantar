import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { verifyGst } from '../setu.js';

// Severity order for deriving a vendor's overall status from its
// verification_attributes (spec §2: overall status is never stored,
// only derived; spec §4: the six-state trust taxonomy).
const STATUS_SEVERITY: Record<string, number> = {
  conflict: 1,
  review_required: 2,
  unavailable: 3,
  stale: 4,
  changed: 5,
  verified: 6,
};

interface ListQuery {
  q?: string;
  plant_id?: string;
  status?: string;
}

// Route params/query values arrive as strings. Number('abc') is NaN, but
// Number('') is 0 and Number('Infinity') is a real (unusable) number — a
// bare isNaN(Number(x)) check lets those slip through and reach a SQL
// parameter as garbage. Requiring the whole string to be digits catches
// all of that and matches what a real bigserial id ever looks like.
function isValidId(value: string): boolean {
  return /^\d+$/.test(value);
}

// pg returns bigint/bigserial columns as strings; coerce id-ish fields to number.
function normalizeIds<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of ['id', 'plant_id']) {
    if (out[key] != null) out[key] = Number(out[key]);
  }
  return out as T;
}

export async function vendorsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get<{ Querystring: ListQuery }>('/api/vendors', async (req, reply) => {
    const { company_id } = req.user!;
    const { q, plant_id, status } = req.query;

    const conditions = ['v.company_id = $1'];
    const params: unknown[] = [company_id];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`v.legal_name ilike $${params.length}`);
    }
    if (plant_id) {
      if (!isValidId(plant_id)) {
        return reply.code(400).send({ error: 'plant_id must be a positive integer' });
      }
      params.push(Number(plant_id));
      conditions.push(`p.id = $${params.length}`);
    }

    const result = await pool.query(
      `select
         v.id, v.legal_name, v.primary_gstin, v.pan, v.entity_status,
         p.id as plant_id, p.name as plant,
         coalesce(
           (select va.status from public.verification_attributes va
            where va.vendor_id = v.id and va.status <> 'verified'
            order by case va.status
              when 'conflict' then 1
              when 'review_required' then 2
              when 'unavailable' then 3
              when 'stale' then 4
              when 'changed' then 5
              else 6 end
            limit 1),
           'verified'
         ) as status,
         (select max(va2.last_verified_at) from public.verification_attributes va2
          where va2.vendor_id = v.id) as last_verified_at
       from public.vendors v
       left join lateral (
         select vr.plant_id from public.vendor_records vr
         where vr.vendor_id = v.id order by vr.id limit 1
       ) first_record on true
       left join public.plants p on p.id = first_record.plant_id
       where ${conditions.join(' and ')}
       order by v.legal_name`,
      params,
    );

    let rows = result.rows.map(normalizeIds);
    if (status) {
      rows = rows.filter((r) => r.status === status);
    }
    rows.sort(
      (a, b) =>
        (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99) ||
        a.legal_name.localeCompare(b.legal_name),
    );

    return reply.send(rows);
  });

  app.get<{ Params: { id: string } }>('/api/vendors/:id', async (req, reply) => {
    const { company_id } = req.user!;
    if (!isValidId(req.params.id)) {
      return reply.code(400).send({ error: 'id must be a positive integer' });
    }
    const id = Number(req.params.id);

    const vendorResult = await pool.query(
      `select v.id, v.legal_name, v.primary_gstin, v.pan, v.entity_status,
              v.registered_address, v.udyam_registration_number,
              p.id as plant_id, p.name as plant
       from public.vendors v
       left join lateral (
         select vr.plant_id from public.vendor_records vr
         where vr.vendor_id = v.id order by vr.id limit 1
       ) first_record on true
       left join public.plants p on p.id = first_record.plant_id
       where v.id = $1 and v.company_id = $2`,
      [id, company_id],
    );
    const vendor = vendorResult.rows[0] ? normalizeIds(vendorResult.rows[0]) : undefined;
    if (!vendor) {
      return reply.code(404).send({ error: 'Vendor not found' });
    }

    const attrsResult = await pool.query(
      `select attribute_type, value, source, last_verified_at, status
       from public.verification_attributes where vendor_id = $1
       order by attribute_type`,
      [id],
    );

    // Source isn't stored on `changes` itself (spec §2); it's carried by
    // whichever verification_attributes row currently tracks that attribute.
    const changesResult = await pool.query(
      `select c.id, c.attribute_type, c.old_value, c.new_value,
              c.detected_at, c.verification_status, va.source
       from public.changes c
       left join public.verification_attributes va
         on va.vendor_id = c.vendor_id and va.attribute_type = c.attribute_type
       where c.vendor_id = $1
       order by c.detected_at desc`,
      [id],
    );

    const status =
      attrsResult.rows.find((a) => a.status !== 'verified')?.status ?? 'verified';

    return reply.send({
      ...vendor,
      status,
      verification_attributes: attrsResult.rows,
      changes: changesResult.rows,
    });
  });

  app.post<{ Params: { id: string } }>('/api/vendors/:id/verify', async (req, reply) => {
    const { company_id, sub: userId } = req.user!;
    if (!isValidId(req.params.id)) {
      return reply.code(400).send({ error: 'id must be a positive integer' });
    }
    const id = Number(req.params.id);

    const vendorResult = await pool.query(
      `select id, legal_name, primary_gstin from public.vendors
       where id = $1 and company_id = $2`,
      [id, company_id],
    );
    const vendor = vendorResult.rows[0] ? normalizeIds(vendorResult.rows[0]) : undefined;
    if (!vendor) {
      return reply.code(404).send({ error: 'Vendor not found' });
    }
    if (!vendor.primary_gstin) {
      return reply.send({ verification: 'failed', vendor });
    }

    const result = await verifyGst(vendor.primary_gstin);

    if (result.ok) {
      // value is the checked datum (the GSTIN itself), not Setu's pass/fail
      // flag -- result.verification ("success"/etc.) only decides the row's
      // status, it was never meant to overwrite the displayed value.
      await pool.query(
        `update public.verification_attributes
         set status = 'verified', value = $1, source = 'Setu GST Sandbox', last_verified_at = now()
         where vendor_id = $2 and attribute_type = 'gstin_status'`,
        [vendor.primary_gstin, id],
      );
      await pool.query(
        `insert into public.audit_log (entity_type, entity_id, action, performed_by)
         values ('vendor', $1, 'Re-verified GST', $2)`,
        [id, userId],
      );
    }

    return reply.send({ verification: result.verification ?? 'failed', vendor });
  });
}
