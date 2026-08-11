import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getVendors } from '../api';
import type { Vendor, VendorStatus } from '../types';
import StatusBadge, { STATUS_META } from '../components/StatusBadge';
import { fmtRelative } from '../format';

const PLANTS = ['Pune', 'Nashik', 'Chennai', 'Rajkot'];
const STATUSES: VendorStatus[] = ['verified', 'changed', 'conflict', 'stale', 'unavailable', 'review_required'];
const PAGE_SIZE = 8;

export default function Vendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [search, setSearch] = useState('');
  const [plantFilter, setPlantFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  const filtered = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter((v) => {
      if (plantFilter !== 'All' && v.plant !== plantFilter) return false;
      if (statusFilter !== 'All' && v.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit =
          v.legal_name.toLowerCase().includes(q) || (v.primary_gstin ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [vendors, search, plantFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function updateFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  return (
    <div style={{ padding: '32px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Vendors</h1>
      <div style={{ color: '#5B6472', fontSize: 13, marginBottom: 20 }}>
        {vendors ? `${filtered.length} shown` : 'Loading…'}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <input
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            placeholder="Search by vendor name or GSTIN"
            style={{
              width: '100%',
              padding: '10px 36px 10px 14px',
              border: '1px solid #E4E7EC',
              borderRadius: 8,
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search ? (
            <button
              onClick={() => updateFilter(setSearch, '')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                padding: 2,
                cursor: 'pointer',
                display: 'flex',
                color: '#8A93A3',
              }}
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          ) : (
            <Search
              size={16}
              strokeWidth={2.25}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A93A3', pointerEvents: 'none' }}
            />
          )}
        </div>
        <select
          value={plantFilter}
          onChange={(e) => updateFilter(setPlantFilter, e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#131B2E' }}
        >
          <option value="All">All plants</option>
          {PLANTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter(setStatusFilter, e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#131B2E' }}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {vendors && filtered.length > 0 && (
        <>
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2.2fr 1fr 1.4fr 1fr',
                gap: 10,
                padding: '12px 20px',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#8A93A3',
                borderBottom: '1px solid #E4E7EC',
                background: '#FAFBFC',
              }}
            >
              <div>VENDOR</div>
              <div>PLANT</div>
              <div>STATUS</div>
              <div>LAST VERIFIED</div>
            </div>
            {paged.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/vendors/${v.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1fr 1.4fr 1fr',
                  gap: 10,
                  padding: '14px 20px',
                  fontSize: 13,
                  borderBottom: '1px solid #F0F2F5',
                  cursor: 'pointer',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{v.legal_name}</div>
                  <div style={{ fontSize: 11.5, color: '#8A93A3', fontFamily: 'ui-monospace,monospace' }}>{v.primary_gstin}</div>
                </div>
                <div style={{ color: '#5B6472' }}>{v.plant}</div>
                <div>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ color: '#8A93A3', fontSize: 12 }}>{fmtRelative(v.last_verified_at)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ color: '#8A93A3', fontSize: 12.5 }}>
              Page {currentPage + 1} of {pageCount}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                style={{ padding: '7px 14px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#131B2E' }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage >= pageCount - 1}
                style={{ padding: '7px 14px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#131B2E' }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {vendors && filtered.length === 0 && (
        <div style={{ background: '#fff', border: '1px dashed #E4E7EC', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No vendors match your search</div>
          <p style={{ color: '#8A93A3', fontSize: 13, margin: '0 0 14px' }}>Try a different name, GSTIN, or plant.</p>
          <span
            onClick={() => {
              setSearch('');
              setPlantFilter('All');
              setStatusFilter('All');
              setPage(0);
            }}
            style={{ color: '#1B3A5C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Clear filters
          </span>
        </div>
      )}
    </div>
  );
}
