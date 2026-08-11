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

export interface VendorDetail extends Vendor {
  verification_attributes: VerificationAttribute[];
}

export interface VerifyResult {
  verification: string;
  vendor: Pick<Vendor, 'id' | 'legal_name' | 'primary_gstin'>;
}
