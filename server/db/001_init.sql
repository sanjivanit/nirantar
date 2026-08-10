-- Nirantar schema — authoritative source: docs/spec.md §2 "What Information We Store".
-- Idempotent: safe to re-run. Enums implemented as CHECK constraints.
--
-- Core principle (spec §2): raw per-plant vendor_records are kept SEPARATE from
-- the resolved canonical vendors. Many vendor_records resolve to one vendor.
-- Overall vendor "status" is NOT stored; it is derived from verification_attributes
-- (spec §10: dashboards read live counts, never a stored number that can drift).

create table if not exists public.companies (
  id         bigserial primary key,
  name       text not null,
  cin        text,
  pan        text,
  created_at timestamptz not null default now()
);

create table if not exists public.plants (
  id          bigserial primary key,
  company_id  bigint not null references public.companies(id),
  name        text not null,
  state       text,
  plant_gstin text,
  created_at  timestamptz not null default now()
);

-- App users. password_hash added for app-level auth (spec Piece 1: bcrypt sign-in).
create table if not exists public.users (
  id            bigserial primary key,
  company_id    bigint not null references public.companies(id),
  plant_id      bigint references public.plants(id),
  name          text not null,
  email         text unique not null,
  password_hash text not null,
  role          text not null check (role in
                  ('plant_finance','group_compliance','group_procurement','cfo','admin')),
  created_at    timestamptz not null default now()
);

-- Resolved, canonical vendor — one per real vendor.
-- Defined before vendor_records because vendor_records.vendor_id references it.
create table if not exists public.vendors (
  id            bigserial primary key,
  company_id    bigint not null references public.companies(id),
  legal_name    text not null,
  primary_gstin text,
  pan           text,
  entity_status text,
  created_at    timestamptz not null default now()
);

-- Raw vendor rows exactly as each plant imported them, one per plant.
create table if not exists public.vendor_records (
  id            bigserial primary key,
  plant_id      bigint not null references public.plants(id),
  vendor_id     bigint references public.vendors(id),   -- null until matched
  source_system text,
  raw_name      text,
  raw_gstin     text,
  raw_pan       text,
  raw_bank_account text,
  raw_ifsc      text,
  imported_at   timestamptz not null default now(),
  import_status text not null default 'pending_match' check (import_status in
                  ('pending_match','matched','insufficient_data'))
);

-- A vendor can hold several GSTINs, state-wise.
create table if not exists public.vendor_gstins (
  id               bigserial primary key,
  vendor_id        bigint not null references public.vendors(id),
  gstin            text not null,
  state            text,
  status           text,
  last_verified_at timestamptz
);

-- The six-state trust taxonomy, per attribute (spec §4).
create table if not exists public.verification_attributes (
  id               bigserial primary key,
  vendor_id        bigint not null references public.vendors(id),
  attribute_type   text not null check (attribute_type in
                     ('gstin_status','udyam_status','bank_account','entity_status')),
  value            text,
  source           text,
  last_verified_at timestamptz,
  status           text not null check (status in
                     ('verified','changed','conflict','stale','unavailable','review_required'))
);

create table if not exists public.bank_accounts (
  id                    bigserial primary key,
  vendor_id             bigint not null references public.vendors(id),
  account_number_masked text,
  ifsc                  text,
  account_holder_name   text,
  name_match_result     text,
  last_verified_at      timestamptz,
  status                text
);

-- Possible duplicates between two raw records. match_confidence is always stored
-- and always shown (spec §4/§6: never a bare duplicate/not-duplicate).
create table if not exists public.duplicate_matches (
  id                  bigserial primary key,
  vendor_record_id_a  bigint not null references public.vendor_records(id),
  vendor_record_id_b  bigint not null references public.vendor_records(id),
  match_confidence    numeric(5,2) not null,          -- percentage, e.g. 94.00
  matched_on          text,                            -- e.g. 'gstin', 'pan+name'
  status              text not null default 'pending_review' check (status in
                        ('pending_review','confirmed_merge','dismissed')),
  reviewed_by         bigint references public.users(id),
  reviewed_at         timestamptz
);

create table if not exists public.invoices (
  id                            bigserial primary key,
  vendor_id                     bigint not null references public.vendors(id),
  plant_id                      bigint not null references public.plants(id),
  invoice_number                text,
  amount                        numeric(14,2) not null,
  invoice_date                  date,
  acceptance_date               date,
  written_agreement_exists      boolean not null default false,
  agreed_payment_days           int,
  msme_classification_at_invoice text,   -- locked at invoice time, never auto-updated
  due_date                      date,
  payment_status                text,
  financial_year                text
);

create table if not exists public.payments (
  id           bigserial primary key,
  invoice_id   bigint not null references public.invoices(id),
  amount       numeric(14,2) not null,
  payment_date date,
  is_partial   boolean not null default false
);

create table if not exists public.changes (
  id                  bigserial primary key,
  vendor_id           bigint not null references public.vendors(id),
  attribute_type      text,
  old_value           text,
  new_value           text,
  detected_at         timestamptz not null default now(),
  verification_status text
);

create table if not exists public.alerts (
  id                bigserial primary key,
  vendor_id         bigint not null references public.vendors(id),
  change_id         bigint references public.changes(id),
  duplicate_match_id bigint references public.duplicate_matches(id),
  invoice_id        bigint references public.invoices(id),
  alert_type        text not null check (alert_type in
                      ('bank_mismatch','possible_duplicate','msme_deadline',
                       'gst_status_change','deregistration')),
  severity          text,
  assigned_to       bigint references public.users(id),
  status            text not null default 'open' check (status in
                      ('open','resolved','escalated','snoozed','dismissed')),
  escalation_deadline timestamptz,   -- set at creation; a cron marks 'escalated' if still open past it
  ai_explanation    text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  resolution_reason text
);

-- Permanent, append-only record. Never edited or erased (spec §6/Piece 9).
create table if not exists public.audit_log (
  id           bigserial primary key,
  entity_type  text not null,
  entity_id    bigint,
  action       text not null,
  performed_by bigint references public.users(id),
  reason       text,
  evidence_ref text,
  timestamp    timestamptz not null default now()
);

create table if not exists public.exports (
  id           bigserial primary key,
  company_id   bigint not null references public.companies(id),
  export_type  text not null check (export_type in ('form_3cd','mca_msme1')),
  period       text,
  generated_at timestamptz not null default now(),
  generated_by bigint references public.users(id)
);

-- Helpful indexes for the FKs the app filters on most.
create index if not exists idx_vendor_records_plant on public.vendor_records(plant_id);
create index if not exists idx_vendor_records_vendor on public.vendor_records(vendor_id);
create index if not exists idx_verification_attributes_vendor on public.verification_attributes(vendor_id);
create index if not exists idx_alerts_status on public.alerts(status);
create index if not exists idx_invoices_vendor on public.invoices(vendor_id);
