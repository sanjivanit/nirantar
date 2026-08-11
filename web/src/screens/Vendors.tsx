import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getVendors } from '../api';
import type { Vendor, VendorStatus } from '../types';
import StatusBadge, { STATUS_META } from '../components/StatusBadge';
import Dropdown from '../components/Dropdown';
import { fmtRelative } from '../format';

const PLANTS = ['Pune', 'Nashik', 'Chennai', 'Rajkot'];
const STATUSES: VendorStatus[] = ['verified', 'changed', 'conflict', 'stale', 'unavailable', 'review_required'];
const PAGE_SIZE = 10;

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
        <Dropdown
          value={plantFilter}
          onChange={(v) => updateFilter(setPlantFilter, v)}
          minWidth={150}
          options={[{ value: 'All', label: 'All plants' }, ...PLANTS.map((p) => ({ value: p, label: p }))]}
        />
        <Dropdown
          value={statusFilter}
          onChange={(v) => updateFilter(setStatusFilter, v)}
          minWidth={170}
          options={[
            { value: 'All', label: 'All statuses' },
            ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
          ]}
        />
      </div>

      {vendors && filtered.length > 0 && (
        <>
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.3fr 0.9fr 1.3fr 1fr',
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
              <div>GSTIN</div>
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
                  gridTemplateColumns: '2fr 1.3fr 0.9fr 1.3fr 1fr',
                  gap: 10,
                  padding: '14px 20px',
                  fontSize: 13,
                  borderBottom: '1px solid #F0F2F5',
                  cursor: 'pointer',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>{v.legal_name}</div>
                <div style={{ fontSize: 12, color: '#5B6472' }}>{v.primary_gstin ?? '—'}</div>
                <div style={{ color: '#5B6472' }}>{v.plant}</div>
                <div>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ color: '#8A93A3', fontSize: 12 }}>{fmtRelative(v.last_verified_at)}</div>
              </div>
            ))}
          </div>
          {pageCount > 1 && (
            <Pagination currentPage={currentPage} pageCount={pageCount} onChange={setPage} />
          )}
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

function getPageNumbers(currentPage: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const pages = new Set<number>([0, pageCount - 1, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < pageCount).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(p);
  });
  return result;
}

function Pagination({ currentPage, pageCount, onChange }: { currentPage: number; pageCount: number; onChange: (p: number) => void }) {
  const [hovered, setHovered] = useState<number | 'prev' | 'next' | null>(null);
  const pages = getPageNumbers(currentPage, pageCount);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 20 }}>
      <button
        onClick={() => onChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        onMouseEnter={() => setHovered('prev')}
        onMouseLeave={() => setHovered(null)}
        aria-label="Previous page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          border: 'none',
          borderRadius: 6,
          background: hovered === 'prev' && currentPage !== 0 ? '#F0F2F5' : 'transparent',
          color: currentPage === 0 ? '#C7CCD4' : '#5B6472',
          cursor: currentPage === 0 ? 'default' : 'pointer',
        }}
      >
        <ChevronLeft size={16} strokeWidth={2.25} />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} style={{ padding: '0 6px', color: '#8A93A3', fontSize: 13 }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            onMouseEnter={() => setHovered(p)}
            onMouseLeave={() => setHovered(null)}
            style={{
              minWidth: 30,
              height: 30,
              padding: '0 4px',
              border: 'none',
              borderRadius: 6,
              background: hovered === p && p !== currentPage ? '#F0F2F5' : 'transparent',
              color: p === currentPage ? '#131B2E' : '#5B6472',
              fontWeight: p === currentPage ? 700 : 400,
              textDecoration: p === currentPage ? 'underline' : 'none',
              textUnderlineOffset: 3,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {p + 1}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(Math.min(pageCount - 1, currentPage + 1))}
        disabled={currentPage >= pageCount - 1}
        onMouseEnter={() => setHovered('next')}
        onMouseLeave={() => setHovered(null)}
        aria-label="Next page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          border: 'none',
          borderRadius: 6,
          background: hovered === 'next' && currentPage < pageCount - 1 ? '#F0F2F5' : 'transparent',
          color: currentPage >= pageCount - 1 ? '#C7CCD4' : '#5B6472',
          cursor: currentPage >= pageCount - 1 ? 'default' : 'pointer',
        }}
      >
        <ChevronRight size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}
