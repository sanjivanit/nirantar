export type Role = 'plant_finance' | 'group_compliance' | 'group_procurement' | 'cfo' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  company_id: number;
  plant_id: number | null;
}

export type VendorStatus =
  | 'verified'
  | 'changed'
  | 'conflict'
  | 'stale'
  | 'unavailable'
  | 'review_required';

export interface Vendor {
  id: number;
  legal_name: string;
  primary_gstin: string | null;
  pan: string | null;
  entity_status: string | null;
  registered_address: string | null;
  udyam_registration_number: string | null;
  plant_id: number | null;
  plant: string | null;
  status: VendorStatus;
  last_verified_at: string | null;
}

export interface VerificationAttribute {
  attribute_type: string;
  value: string | null;
  source: string | null;
  last_verified_at: string | null;
  status: VendorStatus;
}

export interface VendorChange {
  id: number;
  attribute_type: string;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  verification_status: string | null;
  source: string | null;
}

export interface VendorDetail extends Vendor {
  verification_attributes: VerificationAttribute[];
  changes: VendorChange[];
}

export interface VerifyResult {
  verification: string;
  vendor: Pick<Vendor, 'id' | 'legal_name' | 'primary_gstin'>;
}
