// The vendor stat tiles below use the real /api/vendors endpoint (Phase 1,
// live). The "Open alerts" / "MSME payments at risk" tiles and the two
// preview lists use DEMO DATA only — hard-coded in this file, not wired to
// any backend. Real Alerts/MSME logic is out of scope for tonight's build;
// see the full Alerts and MSME Deadlines screens for their own data.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Building2, Bell, TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { getVendors } from '../api';
import type { Vendor } from '../types';
import { useAuth } from '../auth';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { SEVERITY_META } from './Alerts';
import { colors, radius, type, chart } from '../theme';

// Reuses Alerts' SEVERITY_META rather than keeping a second copy of
// severity colors/icons — this panel only ever shows critical/high.
type RecentAlertSeverity = 'critical' | 'high';

const recentAlerts: Array<{ id: number; vendor_name: string; plant: string; severity: RecentAlertSeverity }> = [
  { id: 1, vendor_name: 'Anand Precision Tools', plant: 'Nashik', severity: 'critical' },
  { id: 2, vendor_name: 'Kaveri Metal Works', plant: 'Chennai', severity: 'critical' },
  { id: 3, vendor_name: 'Vishwakarma Forge Industries', plant: 'Pune', severity: 'high' },
];

const upcomingMsme = [
  { id: 1, vendor_name: 'Anand Precision Tools', plant: 'Nashik', amount: '₹54,00,000', when: '7 days overdue', overdue: true },
  { id: 2, vendor_name: 'Vishwakarma Forge Industries', plant: 'Pune', amount: '₹12,00,000', when: '11 days overdue', overdue: true },
  { id: 3, vendor_name: 'Ganesh Enterprises', plant: 'Rajkot', amount: '₹16,00,000', when: 'Due in 9 days', overdue: false },
];

const openAlertCount = 4;
const criticalOpenAlertCount = 2;

const PLANTS = ['Pune', 'Nashik', 'Chennai', 'Rajkot'];

// Mock week-over-week trend deltas for the three simple stat cards — not
// derived from any history table (none exists yet), just illustrative.
const needsAttentionTrend = { direction: 'down' as const, label: '2 vs last week', good: true };
const totalVendorsTrend = { direction: 'up' as const, label: '1 this month', good: true };
const openAlertsTrend = { direction: 'up' as const, label: '1 vs yesterday', good: false };
const msmeOverdueAmount = 5400000 + 1200000; // Anand Precision Tools + Vishwakarma Forge Industries, see MsmeDeadlines.tsx
const msmeUpcomingAmount = 1600000; // Ganesh Enterprises
const msmeExposureAmount = msmeOverdueAmount + msmeUpcomingAmount;
const msmeExposureTotal = `₹${msmeExposureAmount.toLocaleString('en-IN')}`;
const msmeOverdueCount = 2;

function IconChip({ icon: Icon, bg, color }: { icon: LucideIcon; bg: string; color: string }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: radius.sm, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <Icon size={16} strokeWidth={2.25} color={color} />
    </div>
  );
}

function Trend({ direction, label, good }: { direction: 'up' | 'down'; label: string; good: boolean }) {
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;
  const color = good ? colors.success : colors.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color }}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </div>
  );
}

// Semicircle built from stacked colored segments, each a fraction of the
// whole (must sum to <= 1). Colors are passed in by the caller — all drawn
// from our existing status palette (StatusBadge), never introduced here.
function SemicircleGauge({ segments, size = 168 }: { segments: Array<{ fraction: number; color: string }>; size?: number }) {
  const strokeWidth = 14;
  const r = (size - strokeWidth * 2) / 2;
  const cy = r + strokeWidth;
  const startX = strokeWidth;
  const endX = size - strokeWidth;
  const circumference = Math.PI * r;
  const arcPath = `M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`;

  let drawn = 0;
  return (
    <svg width={size} height={cy + strokeWidth / 2 + 4} viewBox={`0 0 ${size} ${cy + strokeWidth / 2 + 4}`}>
      {segments.map((seg, i) => {
        const dash = circumference * Math.max(0, Math.min(1, seg.fraction));
        const dashOffset = -drawn;
        drawn += dash;
        return (
          <path
            key={i}
            d={arcPath}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  const needsAttention = vendors?.filter((v) => v.status !== 'verified').length ?? 0;
  const verifiedClean = vendors ? vendors.length - needsAttention : 0;
  const overdueFraction = msmeOverdueAmount / msmeExposureAmount;
  const upcomingFraction = msmeUpcomingAmount / msmeExposureAmount;
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ ...type.h1, margin: '0 0 6px', color: colors.ink }}>
        Welcome back{firstName ? `, ${firstName}` : ''}
      </h1>
      <p style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>Suryodaya Autocomponents · Pune, Nashik, Chennai, Rajkot</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 20, marginBottom: 28 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <IconChip icon={AlertTriangle} bg="#FBF1E1" color={colors.warning} />
            <Trend {...needsAttentionTrend} />
          </div>
          <div style={{ ...type.label, color: colors.muted, marginBottom: 6 }}>Vendors needing attention</div>
          <div style={{ ...type.stat, color: colors.ink }}>
            {vendors ? needsAttention : '—'}
          </div>
          <div style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{vendors ? `${verifiedClean} verified clean` : 'Loading…'}</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <IconChip icon={Building2} bg={colors.primary[50]} color={colors.primary[600]} />
            <Trend {...totalVendorsTrend} />
          </div>
          <div style={{ ...type.label, color: colors.muted, marginBottom: 6 }}>Total vendors</div>
          <div style={{ ...type.stat, color: colors.ink }}>{vendors ? vendors.length : '—'}</div>
          <Link to="/vendors" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: colors.primary[600], fontSize: 12, marginTop: 8, fontWeight: 600, textDecoration: 'none' }}>
            View all <ArrowRight size={13} strokeWidth={2.25} />
          </Link>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <IconChip icon={Bell} bg="#F8E9E9" color={colors.danger} />
            <Trend {...openAlertsTrend} />
          </div>
          <div style={{ ...type.label, color: colors.muted, marginBottom: 6 }}>Open alerts</div>
          <div style={{ ...type.stat, color: colors.ink }}>{openAlertCount}</div>
          <div style={{ color: colors.danger, fontSize: 12, marginTop: 8, fontWeight: 700 }}>{criticalOpenAlertCount} critical</div>
        </Card>

        <div style={{ gridColumn: 'span 2' }}>
          <Card>
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <div style={{ ...type.cardTitle, color: colors.ink }}>MSME payments at risk</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <SemicircleGauge
                segments={[
                  { fraction: overdueFraction, color: colors.danger },
                  { fraction: upcomingFraction, color: colors.warning },
                ]}
                size={chart.gaugeSize}
              />
              <div style={{ flex: 1, minWidth: 0, borderLeft: `1px solid ${colors.borderSubtle}`, paddingLeft: 28 }}>
                <div style={{ ...type.stat, color: colors.ink, marginBottom: 12 }}>
                  {msmeExposureTotal}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.danger, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.danger }} />
                    {msmeOverdueCount} overdue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.warning, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.warning }} />
                    1 upcoming
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card padding={22}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <div style={{ ...type.cardTitle, color: colors.ink }}>Recent alerts</div>
            <Link to="/alerts" style={{ color: colors.primary[600], fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {recentAlerts.map((a) => {
            const sev = SEVERITY_META[a.severity];
            return (
              <div key={a.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${colors.divider}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.vendor_name}</div>
                  <div style={{ color: colors.faint, fontSize: 12 }}>{a.plant}</div>
                </div>
                <Badge {...sev} compact />
              </div>
            );
          })}
        </Card>

        <Card padding={22}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <div style={{ ...type.cardTitle, color: colors.ink }}>Upcoming MSME deadlines</div>
            <Link to="/msme" style={{ color: colors.primary[600], fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {upcomingMsme.map((i) => {
            const urgent = i.overdue ? colors.danger : colors.warning;
            return (
              <div
                key={i.id}
                className="row-hover"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1.2fr auto',
                  gap: 10,
                  alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: `1px solid ${colors.divider}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.vendor_name}</div>
                  <div style={{ color: colors.faint, fontSize: 11.5 }}>{i.plant}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: urgent }}>{i.when}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, textAlign: 'right' }}>{i.amount}</div>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card padding={22}>
          <div style={{ ...type.cardTitle, color: colors.ink, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            Plant breakdown
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              fontSize: 11.5,
              fontWeight: 700,
              color: colors.faint,
              paddingBottom: 8,
              borderBottom: `1px solid ${colors.borderSubtle}`,
            }}
          >
            <div>PLANT</div>
            <div>VENDORS</div>
            <div>FLAGGED</div>
          </div>
          {PLANTS.map((plant) => {
            const plantVendors = vendors?.filter((v) => v.plant === plant) ?? [];
            const flagged = plantVendors.filter((v) => v.status !== 'verified').length;
            return (
              <div
                key={plant}
                className="row-hover"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 10,
                  fontSize: 13,
                  padding: '12px 0',
                  borderBottom: `1px solid ${colors.divider}`,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>{plant}</div>
                <div style={{ color: colors.muted }}>{vendors ? plantVendors.length : '—'}</div>
                <div style={{ fontWeight: 700, color: flagged > 0 ? colors.warning : colors.faint }}>{vendors ? flagged : '—'}</div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
