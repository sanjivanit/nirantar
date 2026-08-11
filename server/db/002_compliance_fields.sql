-- Adds fields needed for the Trust Profile's Compliance section and the full
-- six-attribute Verification table (spec §2/§4). Idempotent, safe to re-run.
--
-- Schema drift from spec §2, noted deliberately (same convention as the
-- Task 6 commit): spec's verification_attributes.attribute_type enum lists
-- only 4 values (gstin_status, udyam_status, bank_account, entity_status).
-- The Trust Profile actually needs six checked attributes -- legal_name_match,
-- gstin_status, pan_status, bank_account, registered_address, udyam_status --
-- to match what the product spec's "evidence shown with every alert" and
-- Trust Profile description call for. entity_status stays a plain vendor
-- field (already shown in Identity) rather than a "verification" row, since
-- it isn't one of the six attributes the Trust Profile tracks.

alter table public.vendors
  add column if not exists registered_address text,
  add column if not exists udyam_registration_number text;

-- Old rows using the retired entity_status attribute_type would violate the
-- narrowed constraint below; the reseed (server/db/seed.ts) repopulates
-- everything anyway, so clear them out first.
delete from public.verification_attributes where attribute_type = 'entity_status';

alter table public.verification_attributes
  drop constraint if exists verification_attributes_attribute_type_check;

alter table public.verification_attributes
  add constraint verification_attributes_attribute_type_check
  check (attribute_type in
    ('legal_name_match','gstin_status','pan_status','bank_account',
     'registered_address','udyam_status'));
