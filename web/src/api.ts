import type { User, Vendor, VendorDetail, VerifyResult, VendorImportResult, VendorRecordsSummary } from './types';

const TOKEN_KEY = 'nirantar_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  // FormData (file uploads) must NOT get a manual content-type — the
  // browser sets its own multipart/form-data boundary, which we'd break
  // by forcing application/json here.
  const isFormData = opts.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(opts.body && !isFormData ? { 'content-type': 'application/json' } : {}),
    ...(opts.headers as Record<string, string>),
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export { ApiError };

export function login(email: string, password: string): Promise<{ token: string; user: User }> {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function getMe(): Promise<{ user: User }> {
  return apiFetch('/api/auth/me');
}

export function getVendors(params?: { q?: string; plant_id?: number; status?: string }): Promise<Vendor[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.plant_id) qs.set('plant_id', String(params.plant_id));
  if (params?.status) qs.set('status', params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/api/vendors${suffix}`);
}

export function getVendor(id: number): Promise<VendorDetail> {
  return apiFetch(`/api/vendors/${id}`);
}

export function verifyVendor(id: number): Promise<VerifyResult> {
  return apiFetch(`/api/vendors/${id}/verify`, { method: 'POST' });
}

export function importVendorRecords(plantId: number, file: File): Promise<VendorImportResult> {
  const body = new FormData();
  body.append('file', file);
  return apiFetch(`/api/plants/${plantId}/vendor-records/import`, { method: 'POST', body });
}

export function getVendorRecordsSummary(): Promise<VendorRecordsSummary> {
  return apiFetch('/api/vendor-records/summary');
}
