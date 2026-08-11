import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Bell, CalendarClock, FileClock, FileBarChart2, Settings as SettingsIcon, type LucideIcon } from 'lucide-react';
import { useAuth } from '../auth';

const NAV_DEFS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/msme', label: 'MSME Deadlines', icon: CalendarClock },
  { to: '/audit', label: 'Audit Trail', icon: FileClock },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const ROLE_LABEL: Record<string, string> = {
  plant_finance: 'Plant Finance',
  group_compliance: 'Group Compliance',
  group_procurement: 'Group Procurement',
  cfo: 'CFO',
  admin: 'Admin',
};

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div
      style={{
        width: 236,
        flex: 'none',
        background: '#0A1A30',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 14px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 22px 8px' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
            <path
              d="M11 8C6.58 8 3 11.58 3 16C3 20.42 6.58 24 11 24C15 24 17.5 21 19 18"
              stroke="#7FA9C9"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <path
              d="M21 24C25.42 24 29 20.42 29 16C29 11.58 25.42 8 21 8C17 8 14.5 11 13 14"
              stroke="#4FBFA0"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.2px' }}>Nirantar</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_DEFS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                borderLeft: `3px solid ${isActive ? '#4FBFA0' : 'transparent'}`,
                background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                <Icon size={15} strokeWidth={2.25} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{item.label}</div>
            </NavLink>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '14px 10px 4px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 10 }}>
        <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 600 }}>{user?.name}</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
          {user ? (ROLE_LABEL[user.role] ?? user.role) : ''}
        </div>
      </div>
    </div>
  );
}
