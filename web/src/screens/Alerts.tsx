// DEMO DATA — this entire screen is hard-coded, not backend-wired. Alert
// creation, escalation, and the action log below are all client-side only;
// nothing here persists past a page refresh. Vendor names, plants, and
// amounts are grounded in the seeded vendor list (server/db/vendors.seed.json)
// for a realistic look. Real Alerts logic (Piece 7) is a later phase.
import { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  CalendarClock,
  ArrowLeftRight,
  Ban,
  Check,
  ArrowUpCircle,
  Clock,
  X,
  type LucideIcon,
} from 'lucide-react';

type AlertType = 'bank_mismatch' | 'possible_duplicate' | 'msme_deadline' | 'gst_status_change' | 'deregistration';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'open' | 'escalated' | 'resolved' | 'snoozed' | 'dismissed';

interface MockAlert {
  id: number;
  vendor_name: string;
  plant: string;
  alert_type: AlertType;
  severity: Severity;
  status: AlertStatus;
  ai_explanation: string;
  created: string;
  escalation_deadline: string;
}

const ALERT_TYPE_META: Record<AlertType, { label: string; icon: LucideIcon }> = {
  bank_mismatch: { label: 'Bank detail mismatch', icon: AlertTriangle },
  possible_duplicate: { label: 'Possible duplicate vendor', icon: Copy },
  msme_deadline: { label: 'MSME payment deadline', icon: CalendarClock },
  gst_status_change: { label: 'GST status change', icon: ArrowLeftRight },
  deregistration: { label: 'Vendor deregistration', icon: Ban },
};

export const SEVERITY_META: Record<Severity, { label: string; bg: string; fg: string; border: string }> = {
  critical: { label: 'Critical', bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF' },
  high: { label: 'High', bg: '#FBF1E1', fg: '#C48A2E', border: '#EBD3A3' },
  medium: { label: 'Medium', bg: '#EEEBF4', fg: '#6B5B95', border: '#D6CEE6' },
  low: { label: 'Low', bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3' },
};

const STATUS_META: Record<AlertStatus, { label: string; bg: string; fg: string; border: string; icon: LucideIcon }> = {
  open: { label: 'Open', bg: '#E8EEF7', fg: '#2E5B94', border: '#C6D7EC', icon: AlertTriangle },
  escalated: { label: 'Escalated', bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF', icon: ArrowUpCircle },
  resolved: { label: 'Resolved', bg: '#E7F2EF', fg: '#2E7D6B', border: '#B7DBD2', icon: Check },
  snoozed: { label: 'Snoozed', bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3', icon: Clock },
  dismissed: { label: 'Dismissed', bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3', icon: X },
};

export const mockAlerts: MockAlert[] = [
  {
    id: 1,
    vendor_name: 'Anand Precision Tools',
    plant: 'Nashik',
    alert_type: 'bank_mismatch',
    severity: 'critical',
    status: 'open',
    ai_explanation:
      "The bank account on file changed 2 hours ago. This vendor has 6 open invoices worth ₹54,00,000 on Net 45 terms, currently on hold pending verification. Recommend confirming the new account directly with the vendor before releasing any payment.",
    created: '2 hours ago',
    escalation_deadline: 'Escalates in 22 hours if untouched',
  },
  {
    id: 2,
    vendor_name: 'Kaveri Metal Works',
    plant: 'Chennai',
    alert_type: 'deregistration',
    severity: 'critical',
    status: 'escalated',
    ai_explanation:
      "This vendor's GSTIN source has been unreachable for 9 days and the vendor is not registered under Udyam. One invoice worth ₹2,10,000 is on hold. Escalated automatically after 24 hours with no action taken.",
    created: '9 days ago',
    escalation_deadline: 'Escalated to Group Compliance',
  },
  {
    id: 3,
    vendor_name: 'Vishwakarma Forge Industries',
    plant: 'Pune',
    alert_type: 'possible_duplicate',
    severity: 'high',
    status: 'open',
    ai_explanation:
      "This vendor's legal name does not cleanly match the name on file with the GST source of record, flagged as a conflict rather than an automatic match. 2 open invoices worth ₹12,00,000 are currently blocked pending review. This is a possible-match flag only — no merge happens automatically.",
    created: '3 days ago',
    escalation_deadline: 'Escalates in 5 hours if untouched',
  },
  {
    id: 4,
    vendor_name: 'Ganesh Enterprises',
    plant: 'Rajkot',
    alert_type: 'msme_deadline',
    severity: 'high',
    status: 'open',
    ai_explanation:
      'This vendor is Udyam-registered as Micro with Net 45 (MSME) terms. 5 open invoices worth ₹16,00,000 are due in 9 days. Micro and Small vendor payments are capped at a 45-day deadline regardless of contract terms.',
    created: '1 day ago',
    escalation_deadline: 'Escalates in 3 days if untouched',
  },
  {
    id: 5,
    vendor_name: 'Lakshmi Casting Pvt Ltd',
    plant: 'Nashik',
    alert_type: 'bank_mismatch',
    severity: 'medium',
    status: 'resolved',
    ai_explanation:
      'IFSC code on file was updated to reflect a bank branch migration reported by the vendor. Confirmed directly with the vendor\'s finance contact; no payment was affected.',
    created: '6 days ago',
    escalation_deadline: 'Resolved before deadline',
  },
  {
    id: 6,
    vendor_name: 'Om Sai Rubber Components',
    plant: 'Chennai',
    alert_type: 'gst_status_change',
    severity: 'low',
    status: 'snoozed',
    ai_explanation:
      "This vendor's GST status has been unconfirmed for over 90 days, though it last reported as Active. No invoices are currently overdue for this vendor.",
    created: '11 days ago',
    escalation_deadline: 'Snoozed until next verification cycle',
  },
  {
    id: 7,
    vendor_name: 'Sundaram Auto Ancillaries',
    plant: 'Rajkot',
    alert_type: 'possible_duplicate',
    severity: 'low',
    status: 'dismissed',
    ai_explanation:
      'Shared registered address only with another vendor record, no shared GSTIN or PAN. Group Procurement confirmed these are separate legal entities operating from the same industrial estate.',
    created: '2 weeks ago',
    escalation_deadline: 'Dismissed, no further action',
  },
];

const ACTIONS: Array<{ action: AlertStatus; label: string; icon: LucideIcon }> = [
  { action: 'resolved', label: 'Resolve', icon: Check },
  { action: 'escalated', label: 'Escalate', icon: ArrowUpCircle },
  { action: 'snoozed', label: 'Snooze', icon: Clock },
  { action: 'dismissed', label: 'Dismiss', icon: X },
];

const STATUS_FILTERS: Array<{ value: 'all' | AlertStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'snoozed', label: 'Snoozed' },
  { value: 'dismissed', label: 'Dismissed' },
];

function Badge({ bg, fg, border, icon: Icon, label }: { bg: string; fg: string; border: string; icon?: LucideIcon; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 500,
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
      }}
    >
      {Icon && <Icon size={12} strokeWidth={2.25} />}
      {label}
    </span>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<MockAlert[]>(mockAlerts);
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [actionTarget, setActionTarget] = useState<{ id: number; action: AlertStatus } | null>(null);
  const [reason, setReason] = useState('');
  const [hoveredAction, setHoveredAction] = useState<{ id: number; action: AlertStatus } | null>(null);

  const filtered = statusFilter === 'all' ? alerts : alerts.filter((a) => a.status === statusFilter);

  function openActionForm(id: number, action: AlertStatus) {
    setActionTarget({ id, action });
    setReason('');
  }

  function confirmAction() {
    if (!actionTarget || !reason.trim()) return;
    setAlerts((prev) => prev.map((a) => (a.id === actionTarget.id ? { ...a, status: actionTarget.action } : a)));
    setActionTarget(null);
    setReason('');
  }

  return (
    <div style={{ padding: '32px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Alerts</h1>
      <p style={{ color: '#5B6472', fontSize: 13, marginBottom: 20 }}>{filtered.length} shown</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${statusFilter === f.value ? '#1B3A5C' : '#E4E7EC'}`,
              background: statusFilter === f.value ? '#1B3A5C' : '#fff',
              color: statusFilter === f.value ? '#fff' : '#5B6472',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map((a) => {
          const typeMeta = ALERT_TYPE_META[a.alert_type];
          const TypeIcon = typeMeta.icon;
          const sev = SEVERITY_META[a.severity];
          const st = STATUS_META[a.status];
          const isFinal = a.status === 'resolved' || a.status === 'dismissed';
          const showForm = actionTarget?.id === a.id;

          return (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: sev.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <TypeIcon size={17} strokeWidth={2.25} color={sev.fg} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.vendor_name}</div>
                    <div style={{ color: '#8A93A3', fontSize: 12, marginTop: 2 }}>
                      {a.plant} · {typeMeta.label} · {a.created}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  <Badge {...sev} label={sev.label} />
                  <Badge {...st} icon={st.icon} label={st.label} />
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#3D4552', lineHeight: 1.5, margin: '0 0 12px' }}>{a.ai_explanation}</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ color: '#8A93A3', fontSize: 11.5 }}>{a.escalation_deadline}</div>
                {!isFinal && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ACTIONS.map((act) => {
                      const actMeta = STATUS_META[act.action];
                      const isHovered = hoveredAction?.id === a.id && hoveredAction.action === act.action;
                      return (
                        <button
                          key={act.action}
                          onClick={() => openActionForm(a.id, act.action)}
                          onMouseEnter={() => setHoveredAction({ id: a.id, action: act.action })}
                          onMouseLeave={() => setHoveredAction(null)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: `1px solid ${isHovered ? actMeta.border : '#E4E7EC'}`,
                            background: isHovered ? actMeta.bg : '#fff',
                            color: isHovered ? actMeta.fg : '#131B2E',
                          }}
                        >
                          <act.icon size={13} strokeWidth={2.25} />
                          {act.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {showForm && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0F2F5' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5B6472', marginBottom: 6 }}>
                    Reason for marking this alert &ldquo;{STATUS_META[actionTarget.action].label}&rdquo; (required)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. Confirmed new account directly with vendor finance contact"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #E4E7EC',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={confirmAction}
                      disabled={!reason.trim()}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: reason.trim() ? 'pointer' : 'default',
                        background: '#1B3A5C',
                        color: '#fff',
                        opacity: reason.trim() ? 1 : 0.5,
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setActionTarget(null)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #E4E7EC',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: '#fff',
                        color: '#5B6472',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ background: '#fff', border: '1px dashed #E4E7EC', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No alerts match this filter</div>
            <p style={{ color: '#8A93A3', fontSize: 13, margin: 0 }}>Try a different status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
