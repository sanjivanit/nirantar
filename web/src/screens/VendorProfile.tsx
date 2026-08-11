import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ArrowLeftRight, AlertTriangle, type LucideIcon } from 'lucide-react';
import { getVendor, verifyVendor } from '../api';
import type { VendorDetail } from '../types';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import { fmtRelative } from '../format';
import { colors, radius, type } from '../theme';

const ATTRIBUTE_LABEL: Record<string, string> = {
  legal_name_match: 'Legal name match',
  gstin_status: 'GSTIN',
  pan_status: 'PAN',
  bank_account: 'Bank account & IFSC',
  registered_address: 'Registered address',
  udyam_status: 'MSME / Udyam registration',
};

type ToastVariant = 'success' | 'attention' | 'error';

const TOAST_META: Record<ToastVariant, { bg: string; fg: string; border: string; icon: LucideIcon }> = {
  success: { bg: '#E7F2EF', fg: colors.success, border: '#B7DBD2', icon: Check },
  attention: { bg: '#FBF1E1', fg: colors.warning, border: '#EBD3A3', icon: ArrowLeftRight },
  error: { bg: '#F8E9E9', fg: colors.danger, border: '#E9BFBF', icon: AlertTriangle },
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
  const gstinAttr = vendor.verification_attributes.find((a) => a.attribute_type === 'gstin_status');
  const udyamAttr = vendor.verification_attributes.find((a) => a.attribute_type === 'udyam_status');

  return (
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <Link
        to="/vendors"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: colors.muted, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={15} strokeWidth={2.25} />
        Back to Vendors
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ ...type.h1, fontSize: 24, margin: 0, color: colors.ink }}>{vendor.legal_name}</h1>
            <StatusBadge status={vendor.status} />
          </div>
          <div style={{ color: colors.muted, fontSize: 13.5 }}>{vendor.plant}</div>
        </div>
        <button
          onClick={handleVerify}
          disabled={verifying}
          style={{
            padding: '11px 18px',
            border: 'none',
            borderRadius: radius.sm + 1,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: verifying ? 'default' : 'pointer',
            background: colors.primary.gradient,
            color: '#fff',
            opacity: verifying ? 0.7 : 1,
            flex: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {verifying ? 'Re-verifying…' : 'Re-verify against GST'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card padding={22}>
          <div style={{ ...type.cardTitle, color: colors.ink, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            Identity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <Row label="Legal name" value={vendor.legal_name} />
            <Row label="GSTIN" value={vendor.primary_gstin} mono />
            <Row label="PAN" value={vendor.pan} mono />
            <Row label="Entity status" value={vendor.entity_status} />
            <Row label="Registered address" value={vendor.registered_address} />
          </div>
        </Card>

        <Card padding={22}>
          <div style={{ ...type.cardTitle, color: colors.ink, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            Compliance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: colors.faint }}>GST status</span>
              {gstinAttr ? <StatusBadge status={gstinAttr.status} compact /> : <span>—</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: colors.faint }}>MSME / Udyam status</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{udyamAttr?.value ?? '—'}</span>
                {udyamAttr && <StatusBadge status={udyamAttr.status} compact />}
              </span>
            </div>
            <Row label="Udyam registration number" value={vendor.udyam_registration_number} mono />
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Card padding={22}>
          <div style={{ ...type.cardTitle, color: colors.ink, marginBottom: 6 }}>Verification</div>
          <div style={{ color: colors.faint, fontSize: 12, marginBottom: 14 }}>
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
              color: colors.faint,
              borderBottom: `1px solid ${colors.borderSubtle}`,
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
                borderBottom: `1px solid ${colors.divider}`,
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 600 }}>{ATTRIBUTE_LABEL[a.attribute_type] ?? a.attribute_type}</div>
              <div style={{ color: colors.slate }}>{a.value ?? '—'}</div>
              <div style={{ color: colors.faint }}>{a.source ?? '—'}</div>
              <div style={{ color: colors.faint }}>{fmtRelative(a.last_verified_at)}</div>
              <div>
                <StatusBadge status={a.status} compact />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Card padding={22}>
          <div style={{ ...type.cardTitle, color: colors.ink, marginBottom: 6 }}>Change history</div>
          {vendor.changes.length === 0 ? (
            <p style={{ color: colors.faint, fontSize: 13, margin: 0 }}>No changes recorded for this vendor yet.</p>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.3fr 1.6fr 1.6fr 1.4fr 1.2fr',
                  gap: 10,
                  padding: '10px 4px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.faint,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <div>ATTRIBUTE</div>
                <div>OLD VALUE</div>
                <div>NEW VALUE</div>
                <div>SOURCE</div>
                <div>DETECTED</div>
              </div>
              {vendor.changes.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.3fr 1.6fr 1.6fr 1.4fr 1.2fr',
                    gap: 10,
                    padding: '13px 4px',
                    fontSize: 12.5,
                    borderBottom: `1px solid ${colors.divider}`,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{ATTRIBUTE_LABEL[c.attribute_type] ?? c.attribute_type}</div>
                  <div style={{ color: colors.slate }}>{c.old_value ?? '—'}</div>
                  <div style={{ color: colors.slate }}>{c.new_value ?? '—'}</div>
                  <div style={{ color: colors.faint }}>{c.source ?? '—'}</div>
                  <div style={{ color: colors.faint }}>{fmtRelative(c.detected_at)}</div>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Card padding={22}>
          <div style={{ ...type.cardTitle, color: colors.ink, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            Finance context
          </div>
          <p style={{ color: colors.faint, fontSize: 13, margin: 0 }}>No invoices imported for this vendor yet.</p>
        </Card>
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
            borderRadius: radius.sm + 1,
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
      <span style={{ color: colors.faint }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'ui-monospace,monospace' : 'inherit' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
