// The vendor stat tiles below use the real /api/vendors endpoint (Phase 1,
// live). The "Open alerts" / "MSME payments at risk" tiles and the two
// preview lists use DEMO DATA only — hard-coded in this file, not wired to
// any backend. Real Alerts/MSME logic is out of scope for tonight's build;
// see the full Alerts and MSME Deadlines screens for their own data.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, CalendarClock } from 'lucide-react';
import { getVendors } from '../api';
import type { Vendor } from '../types';

const recentAlerts = [
  { id: 1, vendor_name: 'Anand Precision Tools', plant: 'Nashik', severity: 'Critical', color: '#B23A3A' },
  { id: 2, vendor_name: 'Kaveri Metal Works', plant: 'Chennai', severity: 'Critical', color: '#B23A3A' },
  { id: 3, vendor_name: 'Vishwakarma Forge Industries', plant: 'Pune', severity: 'High', color: '#C48A2E' },
];

const upcomingMsme = [
  { id: 1, vendor_name: 'Anand Precision Tools', amount: '₹54,00,000', when: '7 days overdue', overdue: true },
  { id: 2, vendor_name: 'Vishwakarma Forge Industries', amount: '₹12,00,000', when: '11 days overdue', overdue: true },
  { id: 3, vendor_name: 'Ganesh Enterprises', amount: '₹16,00,000', when: 'Due in 9 days', overdue: false },
];

const openAlertCount = 4;
const criticalOpenAlertCount = 2;
const msmeExposureTotal = '₹82,00,000';
const msmeOverdueCount = 2;

function Card({ children }: { children: ReactNode }) {
  return <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 }}>{children}</div>;
}

export default function Dashboard() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  const needsAttention = vendors?.filter((v) => v.status !== 'verified').length ?? 0;
  const verifiedClean = vendors ? vendors.length - needsAttention : 0;

  return (
    <div style={{ padding: '32px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Dashboard</h1>
      <p style={{ color: '#5B6472', fontSize: 13, marginBottom: 20 }}>Suryodaya Autocomponents · Pune, Nashik, Chennai, Rajkot</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <Card>
          <div style={{ color: '#5B6472', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Vendors needing attention</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#131B2E', letterSpacing: '-0.5px' }}>
            {vendors ? needsAttention : '—'}
          </div>
          <div style={{ color: '#5B6472', fontSize: 12, marginTop: 8 }}>{vendors ? `${verifiedClean} verified clean` : 'Loading…'}</div>
        </Card>
        <Card>
          <div style={{ color: '#5B6472', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Total vendors</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#131B2E', letterSpacing: '-0.5px' }}>{vendors ? vendors.length : '—'}</div>
          <Link to="/vendors" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B3A5C', fontSize: 12, marginTop: 8, fontWeight: 600, textDecoration: 'none' }}>
            View all <ArrowRight size={13} strokeWidth={2.25} />
          </Link>
        </Card>
        <Card>
          <div style={{ color: '#5B6472', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Open alerts</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#131B2E', letterSpacing: '-0.5px' }}>{openAlertCount}</div>
          <div style={{ color: '#B23A3A', fontSize: 12, marginTop: 8, fontWeight: 700 }}>{criticalOpenAlertCount} critical</div>
        </Card>
        <Card>
          <div style={{ color: '#5B6472', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>MSME payments at risk</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#131B2E', letterSpacing: '-0.5px' }}>{msmeExposureTotal}</div>
          <div style={{ color: '#5B6472', fontSize: 12, marginTop: 8 }}>{msmeOverdueCount} overdue</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F0F2F5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E' }}>Recent alerts</div>
            <Link to="/alerts" style={{ color: '#1B3A5C', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {recentAlerts.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #F7F8FA' }}>
              <AlertTriangle size={15} strokeWidth={2.25} color={a.color} style={{ marginTop: 1, flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.vendor_name}</div>
                <div style={{ color: '#8A93A3', fontSize: 12 }}>{a.plant} · {a.severity} severity</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F0F2F5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E' }}>Upcoming MSME deadlines</div>
            <Link to="/msme" style={{ color: '#1B3A5C', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {upcomingMsme.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #F7F8FA' }}>
              <CalendarClock size={15} strokeWidth={2.25} color={i.overdue ? '#B23A3A' : '#C48A2E'} style={{ marginTop: 1, flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{i.vendor_name}</div>
                <div style={{ color: '#8A93A3', fontSize: 12 }}>
                  {i.when} · {i.amount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
