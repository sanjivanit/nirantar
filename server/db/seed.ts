import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from '../src/db.js';

interface RawVendor {
  id: number;
  name: string;
  plant: string;
  category: string;
  gstin: string;
  pan: string;
  status: string;
  entityStatus: string;
  gstStatus: string;
  registered: boolean;
  udyamNo: string;
  msmeCat: string;
  address: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const vendors: RawVendor[] = JSON.parse(
  readFileSync(resolve(here, 'vendors.seed.json'), 'utf8'),
);

const PLANT_STATE: Record<string, string> = {
  Pune: 'Maharashtra', Nashik: 'Maharashtra', Chennai: 'Tamil Nadu', Rajkot: 'Gujarat',
};
const PLANT_SYSTEM: Record<string, string> = {
  Pune: 'Tally', Nashik: 'Zoho Books', Chennai: 'Tally', Rajkot: 'SAP Business One',
};
// Design title-case status -> spec 6-state (snake_case).
const STATUS_SNAKE: Record<string, string> = {
  Verified: 'verified', Changed: 'changed', Conflict: 'conflict',
  Stale: 'stale', Unavailable: 'unavailable', 'Review required': 'review_required',
};
// Which spec attribute carries the vendor's flagged state. (Verified => none.)
// Conflict maps to legal_name_match, not entity_status: entity_status isn't
// one of the six Verification attributes (see 002_compliance_fields.sql).
const STATUS_ATTR: Record<string, string> = {
  Changed: 'bank_account', Conflict: 'legal_name_match', Stale: 'gstin_status',
  Unavailable: 'gstin_status', 'Review required': 'udyam_status',
};

const client = await pool.connect();
try {
  await client.query('begin');

  // Re-runnable: reset app tables (fresh DB; other tables empty). CASCADE handles FKs.
  await client.query(`truncate table
    public.exports, public.audit_log, public.alerts, public.changes, public.payments,
    public.invoices, public.duplicate_matches, public.bank_accounts,
    public.verification_attributes, public.vendor_gstins, public.vendor_records,
    public.vendors, public.users, public.plants, public.companies
    restart identity cascade`);

  const companyId: number = (await client.query(
    `insert into public.companies (name) values ($1) returning id`,
    ['Suryodaya Autocomponents Pvt Ltd'],
  )).rows[0].id;

  const plantIds: Record<string, number> = {};
  for (const p of ['Pune', 'Nashik', 'Chennai', 'Rajkot']) {
    plantIds[p] = (await client.query(
      `insert into public.plants (company_id, name, state) values ($1,$2,$3) returning id`,
      [companyId, p, PLANT_STATE[p]],
    )).rows[0].id;
  }

  const hash = await bcrypt.hash('nirantar123', 10);
  const users: Array<[string, string, string, string | null]> = [
    ['Arjun Mehta', 'arjun@suryodaya-auto.com', 'group_compliance', null],
    ['Rohan Kapoor', 'rohan@suryodaya-auto.com', 'cfo', null],
    ['Priya Nair', 'priya.nair@suryodaya-auto.com', 'plant_finance', 'Nashik'],
  ];
  for (const [name, email, role, plant] of users) {
    await client.query(
      `insert into public.users (company_id, plant_id, name, email, password_hash, role)
       values ($1,$2,$3,$4,$5,$6)`,
      [companyId, plant ? plantIds[plant] : null, name, email, hash, role],
    );
  }

  for (const v of vendors) {
    const snake = STATUS_SNAKE[v.status];
    const flaggedAttr: string | undefined = STATUS_ATTR[v.status];
    const attrStatus = (attr: string) => (flaggedAttr === attr ? snake : 'verified');

    const vendorId: number = (await client.query(
      `insert into public.vendors
        (company_id, legal_name, primary_gstin, pan, entity_status,
         registered_address, udyam_registration_number)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [companyId, v.name, v.gstin, v.pan, v.entityStatus, v.address, v.registered ? v.udyamNo : null],
    )).rows[0].id;

    const bankMasked = v.status === 'Changed' ? 'XXXXXX8890' : 'XXXXXX4521';
    const bankIfsc = v.status === 'Changed' ? 'ICIC0004521' : 'HDFC0001234';

    await client.query(
      `insert into public.vendor_records
        (plant_id, vendor_id, source_system, raw_name, raw_gstin, raw_pan,
         raw_bank_account, raw_ifsc, import_status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'matched')`,
      [plantIds[v.plant], vendorId, PLANT_SYSTEM[v.plant], v.name, v.gstin, v.pan, bankMasked, bankIfsc],
    );

    // Value holds the actual checked datum (what was verified); the GST-derived
    // status text (e.g. "Active (unconfirmed 90+ days)") belongs to the status
    // enum + Compliance section, not this column -- see docs/spec.md §4.
    const gstinLastVerified = v.status === 'Unavailable' ? null : '2026-08-05';
    const attrs: Array<[string, string, string, string | null]> = [
      ['legal_name_match', v.status === 'Conflict' ? 'Mismatch — GST portal shows a different registered name' : 'Match', 'GST Portal', gstinLastVerified],
      ['gstin_status', v.gstin, 'GST Portal', gstinLastVerified],
      ['pan_status', v.pan, 'GST Portal', gstinLastVerified],
      ['bank_account', `${bankMasked} · ${bankIfsc}`, 'Bank Confirmation Letter', v.status === 'Changed' ? '2026-08-07' : '2026-06-14'],
      ['registered_address', v.address, 'GST Portal', gstinLastVerified],
      ['udyam_status', v.registered ? `Registered, ${v.msmeCat}` : 'Not registered', 'Udyam Assist Portal', '2026-08-02'],
    ];
    for (const [type, value, source, lv] of attrs) {
      await client.query(
        `insert into public.verification_attributes
          (vendor_id, attribute_type, value, source, last_verified_at, status)
         values ($1,$2,$3,$4,$5,$6)`,
        [vendorId, type, value, source, lv, attrStatus(type)],
      );
    }

    // Change history (spec §2 `changes`): one row for whichever attribute
    // this vendor's flagged status represents, so the Change History section
    // has real data to show for the non-Verified vendors.
    if (flaggedAttr) {
      const CHANGE_VALUES: Record<string, [string, string, string]> = {
        bank_account: [`${bankMasked === 'XXXXXX8890' ? 'XXXXXX4521' : bankMasked} · ${bankIfsc === 'ICIC0004521' ? 'HDFC0001234' : bankIfsc}`, `${bankMasked} · ${bankIfsc}`, '2026-08-07'],
        legal_name_match: ['Match', 'Mismatch — GST portal shows a different registered name', '2026-08-06'],
        gstin_status: ['Active', v.gstStatus, '2026-05-10'],
        udyam_status: ['Registered, Micro', 'Possible duplicate Udyam registration found', '2026-08-08'],
      };
      const change = CHANGE_VALUES[flaggedAttr];
      if (change) {
        const [oldValue, newValue, detectedAt] = change;
        await client.query(
          `insert into public.changes
            (vendor_id, attribute_type, old_value, new_value, detected_at, verification_status)
           values ($1,$2,$3,$4,$5,$6)`,
          [vendorId, flaggedAttr, oldValue, newValue, detectedAt, snake],
        );
      }
    }

    await client.query(
      `insert into public.bank_accounts
        (vendor_id, account_number_masked, ifsc, account_holder_name,
         name_match_result, last_verified_at, status)
       values ($1,$2,$3,$4,'match',$5,$6)`,
      [vendorId, bankMasked, bankIfsc, v.name, v.status === 'Changed' ? '2026-08-07' : '2026-06-14', attrStatus('bank_account')],
    );
  }

  await client.query('commit');
  console.log(`seed complete: 1 company, 4 plants, ${users.length} users, ${vendors.length} vendors`);
} catch (e) {
  await client.query('rollback');
  throw e;
} finally {
  client.release();
  await pool.end();
}
