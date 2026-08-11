import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../auth';
import { mockAlerts } from '../screens/Alerts';

// Notification bell count comes from mockAlerts (Alerts.tsx) — the app's
// one source of truth for alert state. There is no live alerts API yet
// (Piece 7 is out of scope for tonight, same as the Alerts screen itself),
// so this is demo data computed from that single array, not a separately
// hardcoded number and not a real backend count.
const ROLE_LABEL: Record<string, string> = {
  plant_finance: 'Plant Finance',
  group_compliance: 'Group Compliance',
  group_procurement: 'Group Procurement',
  cfo: 'CFO',
  admin: 'Admin',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Header() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const openAlertCount = mockAlerts.filter((a) => a.status === 'open' || a.status === 'escalated').length;

  return (
    <div
      style={{
        height: 64,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '0 40px',
        background: '#fff',
        borderBottom: '1px solid #E4E7EC',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 560 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors, GSTINs, alerts…"
          style={{
            width: '100%',
            padding: '9px 14px 9px 36px',
            border: '1px solid #E4E7EC',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#F6F7F9',
            color: '#131B2E',
          }}
        />
        <Search
          size={15}
          strokeWidth={2.25}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8A93A3', pointerEvents: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ position: 'relative', width: 19, height: 19, flex: 'none' }}>
          <Bell size={19} strokeWidth={2.25} color="#5B6472" />
          {openAlertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -7,
                boxSizing: 'border-box',
                minWidth: 16,
                height: 16,
                padding: '0 3px',
                borderRadius: 20,
                background: '#B23A3A',
                color: '#fff',
                fontSize: 9.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #fff',
              }}
            >
              {openAlertCount}
            </span>
          )}
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#131B2E' }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: '#8A93A3' }}>{ROLE_LABEL[user.role] ?? user.role}</div>
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#1B3A5C',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flex: 'none',
              }}
            >
              {initials(user.name)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
