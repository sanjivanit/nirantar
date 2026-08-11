// DEMO DATA — this entire screen is hard-coded, not backend-wired. Real
// invoice acceptance dates, payment tracking, and the deadline math below
// are not read from any database; nothing here updates automatically. The
// 45-day-cap / Micro-Small-only rule is applied by hand to each row to
// match the spec, not computed by real logic. Vendor names, plants, and
// amounts are grounded in the seeded vendor list (server/db/vendors.seed.json).
// Real MSME deadline tracking (Piece 5/6) is a later phase.
import { useState } from 'react';
import { CircleAlert, CircleCheck, CircleDashed, CircleSlash } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { colors, radius, shadow, type, transition } from '../theme';

type Classification = 'Micro' | 'Small' | 'Medium' | 'Unknown';
type RowStatus = 'overdue' | 'upcoming' | 'paid' | 'not_applicable' | 'insufficient_data';

interface MsmeRow {
  id: number;
  vendor_name: string;
  plant: string;
  invoice_number: string;
  classification: Classification;
  amount: number;
  acceptance_date: string;
  deadline_days: number | null;
  due_date: string | null;
  days_overdue: number;
  status: RowStatus;
  note: string;
}

export function fmtINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

const rows: MsmeRow[] = [
  {
    id: 1,
    vendor_name: 'Anand Precision Tools',
    plant: 'Nashik',
    invoice_number: 'INV-4471',
    classification: 'Small',
    amount: 5400000,
    acceptance_date: '27 Jun 2026',
    deadline_days: 45,
    due_date: '4 Aug 2026',
    days_overdue: 7,
    status: 'overdue',
    note: '6 open invoices on Net 45 (MSME) terms. Payment currently on hold pending a bank re-verification (see Alerts).',
  },
  {
    id: 2,
    vendor_name: 'Vishwakarma Forge Industries',
    plant: 'Pune',
    invoice_number: 'INV-4498',
    classification: 'Small',
    amount: 1200000,
    acceptance_date: '1 Jul 2026',
    deadline_days: 30,
    due_date: '31 Jul 2026',
    days_overdue: 11,
    status: 'overdue',
    note: 'Written agreement specifies Net 30 (under the 45-day cap, so 30 applies). Payment blocked pending a vendor-identity conflict review.',
  },
  {
    id: 3,
    vendor_name: 'Ganesh Enterprises',
    plant: 'Rajkot',
    invoice_number: 'INV-4552',
    classification: 'Micro',
    amount: 1600000,
    acceptance_date: '6 Jul 2026',
    deadline_days: 45,
    due_date: '20 Aug 2026',
    days_overdue: 0,
    status: 'upcoming',
    note: '5 open invoices on Net 45 (MSME) terms. Due in 9 days — not yet overdue.',
  },
  {
    id: 4,
    vendor_name: 'Krishna Wire Industries',
    plant: 'Nashik',
    invoice_number: 'INV-4560',
    classification: 'Medium',
    amount: 860000,
    acceptance_date: '11 Jul 2026',
    deadline_days: null,
    due_date: null,
    days_overdue: 0,
    status: 'not_applicable',
    note: 'Classified Medium at invoice time. The 15/45-day MSME payment rule applies only to Micro and Small vendors, so this invoice is not in scope even though terms mention "Net 45 (MSME)".',
  },
  {
    id: 5,
    vendor_name: 'Kaveri Metal Works',
    plant: 'Chennai',
    invoice_number: 'INV-4501',
    classification: 'Unknown',
    amount: 210000,
    acceptance_date: '2 Aug 2026',
    deadline_days: null,
    due_date: null,
    days_overdue: 0,
    status: 'insufficient_data',
    note: 'Not Udyam-registered and the GST source has been unreachable for 9 days, so classification cannot be confirmed. Held for manual review rather than assumed compliant.',
  },
  {
    id: 6,
    vendor_name: 'Om Sai Rubber Components',
    plant: 'Chennai',
    invoice_number: 'INV-4390',
    classification: 'Micro',
    amount: 640000,
    acceptance_date: '3 Jul 2026',
    deadline_days: 30,
    due_date: '2 Aug 2026',
    days_overdue: 0,
    status: 'paid',
    note: 'Paid on 30 Jul 2026, 3 days ahead of the Net 30 deadline. No exposure.',
  },
  {
    id: 7,
    vendor_name: 'Shree Balaji Fasteners',
    plant: 'Pune',
    invoice_number: 'INV-4322',
    classification: 'Micro',
    amount: 1850000,
    acceptance_date: '20 Jun 2026',
    deadline_days: 30,
    due_date: '20 Jul 2026',
    days_overdue: 0,
    status: 'paid',
    note: 'Paid on time across all 4 open invoices this period. No exposure.',
  },
];

// Overdue previously rendered filled-solid (white on red) while every other
// row status used the light tinted pill — same inconsistency fixed on
// Alerts' severity pills, fixed here the same way: overdue now uses the
// same tinted bg/fg/border treatment as the rest, just with its own color.
// insufficient_data previously shared the old review_required purple
// (#6B5B95) — moved to the same teal used for Alerts' "medium" severity so
// this app-wide "purple = ambiguous/unclassified" meaning stays consistent
// without colliding with the new indigo primary.
const STATUS_META: Record<RowStatus, { label: string; bg: string; fg: string; border: string; icon: typeof CircleAlert }> = {
  overdue: { label: 'Overdue', bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF', icon: CircleAlert },
  upcoming: { label: 'Upcoming', bg: '#FBF1E1', fg: '#C48A2E', border: '#EBD3A3', icon: CircleDashed },
  paid: { label: 'Paid on time', bg: '#E7F2EF', fg: '#2E7D6B', border: '#B7DBD2', icon: CircleCheck },
  not_applicable: { label: 'Not applicable', bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3', icon: CircleSlash },
  insufficient_data: { label: 'Insufficient data', bg: '#E3F1F3', fg: '#1E7A8C', border: '#BFE1E6', icon: CircleDashed },
};

const FILTERS: Array<{ value: 'all' | RowStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'paid', label: 'Paid on time' },
  { value: 'not_applicable', label: 'Not applicable' },
  { value: 'insufficient_data', label: 'Insufficient data' },
];

export const mockMsmeInvoices = rows;

export default function MsmeDeadlines() {
  const [filter, setFilter] = useState<'all' | RowStatus>('all');
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const overdueRows = rows.filter((r) => r.status === 'overdue');
  const upcomingRows = rows.filter((r) => r.status === 'upcoming');
  const totalExposure = [...overdueRows, ...upcomingRows].reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ ...type.h1, margin: '0 0 6px', color: colors.ink }}>MSME Payment Deadlines</h1>
      <p style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>
        Micro and Small vendor invoices, tracked against the statutory 15/45-day payment deadline.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 28, maxWidth: 700 }}>
        <Card>
          <div style={{ ...type.label, color: colors.muted, marginBottom: 8 }}>Overdue</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.danger }}>{overdueRows.length}</div>
        </Card>
        <Card>
          <div style={{ ...type.label, color: colors.muted, marginBottom: 8 }}>Upcoming</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.warning }}>{upcomingRows.length}</div>
        </Card>
        <Card>
          <div style={{ ...type.label, color: colors.muted, marginBottom: 8 }}>Amount at risk</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.ink }}>{fmtINR(totalExposure)}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '7px 14px',
              borderRadius: radius.pill,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${filter === f.value ? colors.primary[600] : colors.border}`,
              background: filter === f.value ? colors.primary.gradient : '#fff',
              color: filter === f.value ? '#fff' : colors.muted,
              transition: `background ${transition.base}, border-color ${transition.base}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, overflow: 'hidden', boxShadow: shadow.card }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 1fr 1.1fr 1fr 1.3fr',
            gap: 10,
            padding: '14px 24px',
            fontSize: 11.5,
            fontWeight: 700,
            color: colors.faint,
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surfaceSunk,
          }}
        >
          <div>VENDOR</div>
          <div>CLASSIFICATION</div>
          <div style={{ textAlign: 'right' }}>AMOUNT</div>
          <div>DUE DATE</div>
          <div>DEADLINE</div>
          <div>STATUS</div>
        </div>

        {filtered.map((r) => {
          const meta = STATUS_META[r.status];
          const label = meta.label + (r.status === 'overdue' ? ` · ${r.days_overdue}d` : '');
          return (
            <div key={r.id} className="row-hover" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1fr 1fr 1.1fr 1fr 1.3fr',
                  gap: 10,
                  padding: '15px 24px',
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{r.vendor_name}</div>
                  <div style={{ fontSize: 11.5, color: colors.faint }}>
                    {r.plant} · {r.invoice_number}
                  </div>
                </div>
                <div style={{ color: colors.muted }}>{r.classification}</div>
                <div style={{ fontWeight: 600, textAlign: 'right' }}>{fmtINR(r.amount)}</div>
                <div style={{ color: colors.muted, fontSize: 12.5 }}>{r.due_date ?? '—'}</div>
                <div style={{ color: colors.faint, fontSize: 12.5 }}>{r.deadline_days ? `${r.deadline_days} days` : '—'}</div>
                <div>
                  <Badge {...meta} label={label} compact />
                </div>
              </div>
              <div style={{ padding: '0 24px 15px', fontSize: 12, color: colors.faint, lineHeight: 1.5 }}>{r.note}</div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: colors.ink }}>No invoices match this filter</div>
            <p style={{ color: colors.faint, fontSize: 13, margin: 0 }}>Try a different status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
