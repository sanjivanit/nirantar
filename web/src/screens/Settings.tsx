// DEMO DATA — this entire screen is hard-coded, not backend-wired. The real
// users/companies/plants tables are seeded and live (server/db/seed.ts), but
// this screen doesn't call any API — the user list below mixes the 3 real
// seeded accounts (Rohan Kapoor, Arjun Mehta, Priya Nair) with a few
// plausible "invited" rows to show what a fuller roster looks like. Toggles
// and the invite button are local state only; nothing persists or sends
// email. Company CIN/PAN are illustrative placeholders — the real company
// record only has a name. Real user/role management is a later phase.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Mail, Bell, Plug, Database, RefreshCw, type LucideIcon } from 'lucide-react';
import Card from '../components/Card';
import { colors, radius, type, transition, tableHeader } from '../theme';

type Role = 'plant_finance' | 'group_compliance' | 'group_procurement' | 'cfo' | 'admin';

const ROLE_LABEL: Record<Role, string> = {
  plant_finance: 'Plant Finance',
  group_compliance: 'Group Compliance',
  group_procurement: 'Group Procurement',
  cfo: 'CFO',
  admin: 'Admin',
};

// group_compliance previously shared the old review_required purple
// (#6B5B95) — moved to teal, same reasoning as the other former users of
// that color: it's too close to the new indigo primary to stay
// distinguishable at a glance.
const ROLE_BADGE: Record<Role, { bg: string; fg: string; border: string }> = {
  plant_finance: { bg: '#EEF1F5', fg: '#3D5A80', border: '#CBD8E8' },
  group_compliance: { bg: '#E3F1F3', fg: '#1E7A8C', border: '#BFE1E6' },
  group_procurement: { bg: '#FBF1E1', fg: '#C48A2E', border: '#EBD3A3' },
  cfo: { bg: '#E7F2EF', fg: '#2E7D6B', border: '#B7DBD2' },
  admin: { bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF' },
};

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  plant: string | null;
  status: 'active' | 'invited';
}

const users: UserRow[] = [
  { id: 1, name: 'Rohan Kapoor', email: 'rohan@suryodaya-auto.com', role: 'cfo', plant: null, status: 'active' },
  { id: 2, name: 'Arjun Mehta', email: 'arjun@suryodaya-auto.com', role: 'group_compliance', plant: null, status: 'active' },
  { id: 3, name: 'Priya Nair', email: 'priya.nair@suryodaya-auto.com', role: 'plant_finance', plant: 'Nashik', status: 'active' },
  { id: 4, name: 'Vikram Desai', email: 'vikram.desai@suryodaya-auto.com', role: 'plant_finance', plant: 'Pune', status: 'invited' },
  { id: 5, name: 'Meera Krishnan', email: 'meera.krishnan@suryodaya-auto.com', role: 'group_procurement', plant: null, status: 'invited' },
];

const PLANTS = [
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Rajkot', state: 'Gujarat' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 38,
        height: 22,
        borderRadius: 20,
        border: 'none',
        cursor: 'pointer',
        background: checked ? colors.primary[600] : '#D8DCE3',
        position: 'relative',
        flex: 'none',
        transition: `background ${transition.base}`,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Card padding={22}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${colors.borderSubtle}` }}>
          <Icon size={16} strokeWidth={2.25} color={colors.primary[600]} />
          <div style={{ ...type.cardTitle, color: colors.ink }}>{title}</div>
        </div>
        {children}
      </Card>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifDigest, setNotifDigest] = useState(true);
  const [notifMsme, setNotifMsme] = useState(false);

  return (
    <div style={{ padding: '36px 40px 60px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ ...type.h1, margin: '0 0 6px', color: colors.ink }}>Settings</h1>
      <p style={{ color: colors.muted, fontSize: 13.5, marginBottom: 24 }}>Company profile, users, notifications, and integrations.</p>

      <SectionCard icon={Building2} title="Company profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, maxWidth: 480, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.faint }}>Company name</span>
            <span style={{ fontWeight: 600 }}>Suryodaya Autocomponents Pvt Ltd</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.faint }}>CIN</span>
            <span style={{ fontWeight: 600, fontFamily: 'ui-monospace,monospace' }}>U29100MH2014PTC256789</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.faint }}>PAN</span>
            <span style={{ fontWeight: 600, fontFamily: 'ui-monospace,monospace' }}>AABCS1234C</span>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: colors.faint, marginBottom: 10 }}>PLANTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {PLANTS.map((p) => (
            <div key={p.name} style={{ background: colors.surfaceSunk, border: `1px solid ${colors.borderSubtle}`, borderRadius: radius.sm, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
              <div style={{ color: colors.faint, fontSize: 11.5, marginTop: 2 }}>{p.state}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={ShieldCheck} title="Users &amp; roles">
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.8fr 1.4fr 1fr 0.8fr',
              gap: 10,
              padding: '10px 16px',
              ...tableHeader,
            }}
          >
            <div>NAME</div>
            <div>EMAIL</div>
            <div>ROLE</div>
            <div>PLANT</div>
            <div>STATUS</div>
          </div>
          {users.map((u) => {
            const badge = ROLE_BADGE[u.role];
            return (
              <div
                key={u.id}
                className="row-hover"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1.8fr 1.4fr 1fr 0.8fr',
                  gap: 10,
                  padding: '12px 16px',
                  fontSize: 12.5,
                  borderBottom: `1px solid ${colors.divider}`,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ color: colors.faint }}>{u.email}</div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 9px',
                      borderRadius: radius.pill,
                      fontSize: 11,
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.fg,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {ROLE_LABEL[u.role]}
                  </span>
                </div>
                <div style={{ color: colors.muted }}>{u.plant ?? 'Group'}</div>
                <div style={{ color: u.status === 'active' ? colors.success : colors.faint, fontWeight: 600 }}>
                  {u.status === 'active' ? 'Active' : 'Invited'}
                </div>
              </div>
            );
          })}
        </div>
        <button
          style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            background: '#fff',
            color: colors.primary[600],
          }}
        >
          <Mail size={13} strokeWidth={2.25} />
          Invite user
        </button>
      </SectionCard>

      <SectionCard icon={Bell} title="Notification preferences">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Critical alerts</div>
              <div style={{ fontSize: 12, color: colors.faint }}>Email me immediately when a critical-severity alert is created.</div>
            </div>
            <Toggle checked={notifCritical} onChange={() => setNotifCritical((v) => !v)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Weekly compliance digest</div>
              <div style={{ fontSize: 12, color: colors.faint }}>A summary of open alerts and vendor status changes, every Monday.</div>
            </div>
            <Toggle checked={notifDigest} onChange={() => setNotifDigest((v) => !v)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>MSME deadline reminders</div>
              <div style={{ fontSize: 12, color: colors.faint }}>Notify 3 days before a Micro/Small vendor payment deadline.</div>
            </div>
            <Toggle checked={notifMsme} onChange={() => setNotifMsme((v) => !v)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Plug} title="Integrations">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Setu Data Gateway</div>
            <div style={{ fontSize: 12, color: colors.faint }}>GSTIN, PAN, and bank-account verification (sandbox environment).</div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: radius.pill,
              fontSize: 12,
              fontWeight: 600,
              background: '#E7F2EF',
              color: colors.success,
              border: '1px solid #B7DBD2',
            }}
          >
            Connected
          </span>
        </div>
      </SectionCard>

      <SectionCard icon={Database} title="Data sources">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Vendor master sync</div>
            <div style={{ fontSize: 12, color: colors.faint }}>
              Re-checks every vendor against GST and Udyam, and re-runs cross-plant duplicate matching. Last run: 5 hours ago.
            </div>
          </div>
          <button
            onClick={() => navigate('/sync')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              border: 'none',
              borderRadius: radius.sm,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: colors.primary.gradient,
              color: '#fff',
              flex: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={13} strokeWidth={2.25} />
            Re-scan all vendors
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
