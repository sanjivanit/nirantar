// DEMO DATA — this entire screen is hard-coded, not backend-wired. The real
// audit_log table (server/db/001_init.sql) exists in the schema but nothing
// in the server writes to it yet, and no route reads it. Entries below are
// grounded in the users actually seeded (Rohan Kapoor · CFO, Arjun Mehta ·
// Group Compliance, Priya Nair · Plant Finance, Nashik) and in the same
// vendors/alerts used on the Alerts screen, for a consistent demo. Real
// permanent-audit logging (Piece 9) is a later phase.
import { useState } from 'react';
import { Building2, Bell, FileBarChart2, UserCircle2, ShieldCheck, type LucideIcon } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import { colors, radius, shadow, type } from '../theme';

type EntityType = 'vendor' | 'alert' | 'export' | 'user';

interface AuditEntry {
  id: number;
  timestamp: string;
  entity_type: EntityType;
  entity_label: string;
  action: string;
  performed_by: string;
  reason: string | null;
}

const ENTITY_META: Record<EntityType, { label: string; icon: LucideIcon }> = {
  vendor: { label: 'Vendor', icon: Building2 },
  alert: { label: 'Alert', icon: Bell },
  export: { label: 'Export', icon: FileBarChart2 },
  user: { label: 'User', icon: UserCircle2 },
};

const ACTION_LABEL: Record<string, string> = {
  created: 'Created',
  escalated: 'Escalated',
  resolved: 'Resolved',
  snoozed: 'Snoozed',
  dismissed: 'Dismissed',
  re_verified: 'Re-verified',
  generated: 'Generated',
  role_assigned: 'Role assigned',
};

const entries: AuditEntry[] = [
  { id: 1, timestamp: '10 Aug 2026, 8:05 am', entity_type: 'alert', entity_label: 'Alert · Om Sai Rubber Components', action: 'created', performed_by: 'System', reason: null },
  { id: 2, timestamp: '9 Aug 2026, 3:40 pm', entity_type: 'alert', entity_label: 'Alert · Vishwakarma Forge Industries', action: 'created', performed_by: 'System', reason: null },
  { id: 3, timestamp: '9 Aug 2026, 11:47 am', entity_type: 'vendor', entity_label: 'Vishwakarma Forge Industries', action: 're_verified', performed_by: 'Arjun Mehta (Group Compliance)', reason: null },
  { id: 4, timestamp: '9 Aug 2026, 9:20 am', entity_type: 'alert', entity_label: 'Alert · Kaveri Metal Works', action: 'escalated', performed_by: 'System (24h deadline passed)', reason: null },
  { id: 5, timestamp: '8 Aug 2026, 2:15 pm', entity_type: 'alert', entity_label: 'Alert · Sundaram Auto Ancillaries', action: 'dismissed', performed_by: 'Rohan Kapoor (CFO)', reason: 'Confirmed two separate legal entities sharing an industrial estate address; no shared GSTIN or PAN.' },
  { id: 6, timestamp: '8 Aug 2026, 10:12 am', entity_type: 'alert', entity_label: 'Alert · Anand Precision Tools', action: 'created', performed_by: 'System', reason: null },
  { id: 7, timestamp: '7 Aug 2026, 4:30 pm', entity_type: 'alert', entity_label: 'Alert · Lakshmi Casting Pvt Ltd', action: 'resolved', performed_by: 'Arjun Mehta (Group Compliance)', reason: 'Confirmed bank branch migration directly with the vendor\'s finance contact.' },
  { id: 8, timestamp: '7 Aug 2026, 9:00 am', entity_type: 'alert', entity_label: 'Alert · Ganesh Enterprises', action: 'created', performed_by: 'System', reason: null },
  { id: 9, timestamp: '5 Aug 2026, 11:00 am', entity_type: 'alert', entity_label: 'Alert · Om Sai Rubber Components (earlier cycle)', action: 'snoozed', performed_by: 'Priya Nair (Plant Finance, Nashik)', reason: 'No open invoices for this vendor; revisit at next verification cycle.' },
  { id: 10, timestamp: '1 Aug 2026, 10:00 am', entity_type: 'export', entity_label: 'Form 3CD · FY 2025-26, Q1', action: 'generated', performed_by: 'Rohan Kapoor (CFO)', reason: null },
  { id: 11, timestamp: '20 Jul 2026, 9:00 am', entity_type: 'vendor', entity_label: 'Anand Precision Tools', action: 're_verified', performed_by: 'System (Setu sync)', reason: null },
  { id: 12, timestamp: '15 Jul 2026, 9:00 am', entity_type: 'user', entity_label: 'Priya Nair', action: 'role_assigned', performed_by: 'Rohan Kapoor (CFO)', reason: 'Onboarded as Nashik plant finance lead.' },
];

const FILTERS: Array<{ value: 'all' | EntityType; label: string }> = [
  { value: 'all', label: 'All entity types' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'alert', label: 'Alert' },
  { value: 'export', label: 'Export' },
  { value: 'user', label: 'User' },
];

export default function AuditTrail() {
  const [filter, setFilter] = useState<'all' | EntityType>('all');
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.entity_type === filter);

  return (
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ ...type.h1, margin: '0 0 6px', color: colors.ink }}>Audit Trail</h1>
      <p style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>Every action taken on a vendor, alert, or export, in one place.</p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: colors.primary[50],
          border: `1px solid ${colors.primary[100]}`,
          borderRadius: radius.md,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 13,
          color: colors.primary[700],
          fontWeight: 600,
        }}
      >
        <ShieldCheck size={16} strokeWidth={2.25} style={{ flex: 'none' }} />
        This is a permanent, append-only record. Entries can never be edited or deleted, even by an Admin.
      </div>

      <div style={{ marginBottom: 16, maxWidth: 220 }}>
        <Dropdown value={filter} onChange={(v) => setFilter(v as 'all' | EntityType)} options={FILTERS} minWidth={220} />
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, overflow: 'hidden', boxShadow: shadow.card }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1.8fr 1fr 1.6fr 2fr',
            gap: 10,
            padding: '14px 24px',
            fontSize: 11.5,
            fontWeight: 700,
            color: colors.faint,
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surfaceSunk,
          }}
        >
          <div>TIMESTAMP</div>
          <div>ENTITY</div>
          <div>ACTION</div>
          <div>PERFORMED BY</div>
          <div>REASON</div>
        </div>
        {filtered.map((e) => {
          const meta = ENTITY_META[e.entity_type];
          const Icon = meta.icon;
          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.8fr 1fr 1.6fr 2fr',
                gap: 10,
                padding: '15px 24px',
                fontSize: 12.5,
                borderBottom: `1px solid ${colors.borderSubtle}`,
                alignItems: 'center',
              }}
            >
              <div style={{ color: colors.faint }}>{e.timestamp}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} strokeWidth={2.25} style={{ color: colors.faint, flex: 'none' }} />
                <span style={{ fontWeight: 600, color: colors.ink }}>{e.entity_label}</span>
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 9px',
                    borderRadius: radius.pill,
                    fontSize: 11.5,
                    fontWeight: 600,
                    background: colors.surfaceSunk,
                    color: colors.muted,
                  }}
                >
                  {ACTION_LABEL[e.action] ?? e.action}
                </span>
              </div>
              <div style={{ color: colors.slate }}>{e.performed_by}</div>
              <div style={{ color: colors.faint }}>{e.reason ?? '—'}</div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: colors.ink }}>No entries match this filter</div>
            <p style={{ color: colors.faint, fontSize: 13, margin: 0 }}>Try a different entity type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
