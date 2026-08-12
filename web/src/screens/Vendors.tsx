import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, Eye, RefreshCw, Check, AlertTriangle, Upload } from 'lucide-react';
import { getVendors, verifyVendor } from '../api';
import type { Vendor, VendorStatus } from '../types';
import StatusBadge, { STATUS_META } from '../components/StatusBadge';
import Dropdown from '../components/Dropdown';
import ActionMenu from '../components/ActionMenu';
import VendorImportModal from '../components/VendorImportModal';
import { fmtRelative } from '../format';
import { colors, radius, shadow, type, transition, tableHeader } from '../theme';

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
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Derived from already-loaded vendors rather than a dedicated plants
  // endpoint (none exists yet) — every vendor already carries its plant id
  // and name.
  const plantOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const v of vendors ?? []) {
      if (v.plant_id != null && v.plant && !seen.has(v.plant_id)) seen.set(v.plant_id, v.plant);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [vendors]);

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  async function handleRowVerify(v: Vendor) {
    setVerifyingId(v.id);
    setToast(null);
    try {
      await verifyVendor(v.id);
      const fresh = await getVendors();
      setVendors(fresh);
      setToast({ variant: 'success', message: `${v.legal_name} re-verified against GST.` });
    } catch {
      setToast({ variant: 'error', message: `Re-verification failed for ${v.legal_name}.` });
    } finally {
      setVerifyingId(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

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
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <h1 style={{ ...type.h1, margin: '0 0 6px', color: colors.ink }}>Vendors</h1>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          disabled={!vendors}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: vendors ? 'pointer' : 'default',
            background: '#fff',
            color: colors.primary[600],
            opacity: vendors ? 1 : 0.5,
            flex: 'none',
          }}
        >
          <Upload size={14} strokeWidth={2.25} />
          Import vendors
        </button>
      </div>
      <div style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>
        {vendors ? `${filtered.length} shown` : 'Loading…'}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <input
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search by vendor name or GSTIN"
            style={{
              width: '100%',
              padding: '10px 36px 10px 14px',
              border: `1px solid ${searchFocused ? colors.primary[600] : colors.border}`,
              borderRadius: radius.sm,
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: searchFocused ? `0 0 0 3px ${colors.primary[100]}` : 'none',
              transition: `border-color ${transition.base}, box-shadow ${transition.base}`,
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
                color: colors.faint,
              }}
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          ) : (
            <Search
              size={16}
              strokeWidth={2.25}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: colors.faint, pointerEvents: 'none' }}
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
          <div style={{ background: colors.surface, borderRadius: radius.lg, overflow: 'hidden', boxShadow: shadow.card }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.3fr 0.9fr 1.3fr 1fr 0.3fr',
                gap: 10,
                padding: '14px 24px',
                ...tableHeader,
              }}
            >
              <div>VENDOR</div>
              <div>GSTIN</div>
              <div>PLANT</div>
              <div>STATUS</div>
              <div>LAST VERIFIED</div>
              <div />
            </div>
            {paged.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/vendors/${v.id}`)}
                onMouseEnter={() => setHoveredRow(v.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.3fr 0.9fr 1.3fr 1fr 0.3fr',
                  gap: 10,
                  padding: '15px 24px',
                  fontSize: 13,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                  cursor: 'pointer',
                  alignItems: 'center',
                  background: hoveredRow === v.id ? colors.primary[50] : 'transparent',
                  transition: `background ${transition.base}`,
                }}
              >
                <div style={{ fontWeight: 600 }}>{v.legal_name}</div>
                <div style={{ fontSize: 12, color: colors.muted }}>{v.primary_gstin ?? '—'}</div>
                <div style={{ color: colors.muted }}>{v.plant}</div>
                <div>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ color: colors.faint, fontSize: 12 }}>{fmtRelative(v.last_verified_at)}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ActionMenu
                    items={[
                      { label: 'View profile', icon: Eye, onClick: () => navigate(`/vendors/${v.id}`) },
                      {
                        label: verifyingId === v.id ? 'Re-verifying…' : 'Re-verify against GST',
                        icon: RefreshCw,
                        disabled: verifyingId === v.id,
                        onClick: () => handleRowVerify(v),
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
          {pageCount > 1 && (
            <Pagination currentPage={currentPage} pageCount={pageCount} onChange={setPage} />
          )}
        </>
      )}

      {vendors && filtered.length === 0 && (
        <div style={{ background: colors.surface, border: `1px dashed ${colors.border}`, borderRadius: radius.lg, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: colors.ink }}>No vendors match your search</div>
          <p style={{ color: colors.faint, fontSize: 13, margin: '0 0 14px' }}>Try a different name, GSTIN, or plant.</p>
          <span
            onClick={() => {
              setSearch('');
              setPlantFilter('All');
              setStatusFilter('All');
              setPage(0);
            }}
            style={{ color: colors.primary[600], fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Clear filters
          </span>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: toast.variant === 'success' ? '#E7F2EF' : '#F8E9E9',
            color: toast.variant === 'success' ? colors.success : colors.danger,
            border: `1px solid ${toast.variant === 'success' ? '#B7DBD2' : '#E9BFBF'}`,
            padding: '12px 18px',
            borderRadius: radius.sm + 1,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: shadow.popover,
            maxWidth: 340,
          }}
        >
          {toast.variant === 'success' ? <Check size={16} strokeWidth={2.25} /> : <AlertTriangle size={16} strokeWidth={2.25} />}
          {toast.message}
        </div>
      )}

      <VendorImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        plantOptions={plantOptions}
        onImported={() => {
          // Matches the existing refresh-after-mutation pattern used by
          // handleRowVerify above. Note: imported rows land in
          // vendor_records (raw, unmatched) — they won't actually appear
          // here until duplicate-matching (Piece 4) links them to a
          // canonical vendor, which doesn't exist yet. Refetching is still
          // correct/harmless and will start working the moment that ships.
          getVendors().then(setVendors);
        }}
      />
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
          borderRadius: radius.sm - 2,
          background: hovered === 'prev' && currentPage !== 0 ? colors.primary[50] : 'transparent',
          color: currentPage === 0 ? '#C7CCD4' : colors.muted,
          cursor: currentPage === 0 ? 'default' : 'pointer',
          transition: `background ${transition.base}`,
        }}
      >
        <ChevronLeft size={16} strokeWidth={2.25} />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} style={{ padding: '0 6px', color: colors.faint, fontSize: 13 }}>
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
              borderRadius: radius.sm - 2,
              background: p === currentPage ? colors.primary[600] : hovered === p ? colors.primary[50] : 'transparent',
              color: p === currentPage ? '#fff' : colors.muted,
              fontWeight: p === currentPage ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: `background ${transition.base}, color ${transition.base}`,
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
          borderRadius: radius.sm - 2,
          background: hovered === 'next' && currentPage < pageCount - 1 ? colors.primary[50] : 'transparent',
          color: currentPage >= pageCount - 1 ? '#C7CCD4' : colors.muted,
          cursor: currentPage >= pageCount - 1 ? 'default' : 'pointer',
          transition: `background ${transition.base}`,
        }}
      >
        <ChevronRight size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}
