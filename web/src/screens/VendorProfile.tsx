import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ArrowLeftRight, AlertTriangle, type LucideIcon } from 'lucide-react';
import { getVendor, verifyVendor } from '../api';
import type { VendorDetail } from '../types';
import StatusBadge from '../components/StatusBadge';
import { fmtRelative } from '../format';

const ATTRIBUTE_LABEL: Record<string, string> = {
  gstin_status: 'GSTIN',
  udyam_status: 'MSME / Udyam registration',
  bank_account: 'Bank account & IFSC',
  entity_status: 'Entity status',
};

type ToastVariant = 'success' | 'attention' | 'error';

const TOAST_META: Record<ToastVariant, { bg: string; fg: string; border: string; icon: LucideIcon }> = {
  success: { bg: '#E7F2EF', fg: '#2E7D6B', border: '#B7DBD2', icon: Check },
  attention: { bg: '#FBF1E1', fg: '#C48A2E', border: '#EBD3A3', icon: ArrowLeftRight },
  error: { bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF', icon: AlertTriangle },
};

export default function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null);

  useEffect(() => {
    if (id) getVendor(Number(id)).then(setVendor);
  }, [id]);

  async function handleVerify() {
    if (!id) return;
    setVerifying(true);
    setToast(null);
    try {
      const result = await verifyVendor(Number(id));
      const fresh = await getVendor(Number(id));
      setVendor(fresh);
      if (result.verification === 'success') {
        setToast({ variant: 'success', message: 'Confirmed. GST status checked and verified.' });
      } else {
        setToast({ variant: 'attention', message: `GST re-check returned an unconfirmed result: ${result.verification}.` });
      }
    } catch {
      setToast({ variant: 'error', message: 'Re-verification could not be completed. Try again.' });
    } finally {
      setVerifying(false);
      setTimeout(() => setToast(null), 5000);
    }
  }

  if (!vendor) {
    return <div style={{ padding: '32px 40px' }}>Loading…</div>;
  }

  const ToastIcon = toast ? TOAST_META[toast.variant].icon : null;

  return (
    <div style={{ padding: '32px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <Link
        to="/vendors"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5B6472', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={15} strokeWidth={2.25} />
        Back to Vendors
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.3px' }}>{vendor.legal_name}</h1>
          <div style={{ color: '#5B6472', fontSize: 13.5 }}>{vendor.plant}</div>
        </div>
        <StatusBadge status={vendor.status} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 22, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F0F2F5' }}>
          Identity
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
          <Row label="Legal name" value={vendor.legal_name} />
          <Row label="GSTIN" value={vendor.primary_gstin} mono />
          <Row label="PAN" value={vendor.pan} mono />
          <Row label="Entity status" value={vendor.entity_status} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 22, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E', marginBottom: 6 }}>Verification</div>
        <div style={{ color: '#8A93A3', fontSize: 12, marginBottom: 14 }}>
          Each attribute below is checked independently against its own source of record.
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 2fr 1.4fr 1fr 1.1fr',
            gap: 10,
            padding: '10px 4px',
            fontSize: 11,
            fontWeight: 700,
            color: '#8A93A3',
            borderBottom: '1px solid #F0F2F5',
          }}
        >
          <div>ATTRIBUTE</div>
          <div>VALUE</div>
          <div>SOURCE</div>
          <div>VERIFIED</div>
          <div>STATUS</div>
        </div>
        {vendor.verification_attributes.map((a) => (
          <div
            key={a.attribute_type}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 2fr 1.4fr 1fr 1.1fr',
              gap: 10,
              padding: '13px 4px',
              fontSize: 12.5,
              borderBottom: '1px solid #F7F8FA',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 600 }}>{ATTRIBUTE_LABEL[a.attribute_type] ?? a.attribute_type}</div>
            <div style={{ color: '#3D4552' }}>{a.value ?? '—'}</div>
            <div style={{ color: '#8A93A3' }}>{a.source ?? '—'}</div>
            <div style={{ color: '#8A93A3' }}>{fmtRelative(a.last_verified_at)}</div>
            <div>
              <StatusBadge status={a.status} compact />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 22, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F0F2F5' }}>
          Finance context
        </div>
        <p style={{ color: '#8A93A3', fontSize: 13, margin: 0 }}>No invoices imported for this vendor yet.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E', marginBottom: 6 }}>Re-verify</div>
        <p style={{ color: '#8A93A3', fontSize: 12, marginBottom: 14 }}>
          Re-checks this vendor's GSTIN against Setu's sandbox and updates the row above.
        </p>
        <button
          onClick={handleVerify}
          disabled={verifying}
          style={{
            padding: '11px 18px',
            border: 'none',
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: verifying ? 'default' : 'pointer',
            background: '#1B3A5C',
            color: '#fff',
            opacity: verifying ? 0.7 : 1,
          }}
        >
          {verifying ? 'Re-verifying…' : 'Re-verify against GST'}
        </button>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: TOAST_META[toast.variant].bg,
            color: TOAST_META[toast.variant].fg,
            border: `1px solid ${TOAST_META[toast.variant].border}`,
            padding: '12px 18px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            maxWidth: 340,
          }}
        >
          {ToastIcon && <ToastIcon size={16} strokeWidth={2.25} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: '#8A93A3' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'ui-monospace,monospace' : 'inherit' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
