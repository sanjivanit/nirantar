// DEMO DATA — this screen simulates a re-scan with a fixed local timer, not
// a real backend process. No API call is made; the checklist below always
// completes the same way on the same schedule before redirecting to the
// Dashboard. Adapted from the "Building your Trust Profiles" onboarding
// screen in design/Nirantar.dc.html, wired here as an in-app action instead,
// since Phase 1 already has a real logged-in vendor list rather than an
// onboarding flow. Two entry points: automatically once per browser session
// right after login (see Login.tsx + syncSession.ts), and on demand from
// Settings → Data sources → Re-scan all vendors.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { markSyncedThisSession } from '../syncSession';
import Card from '../components/Card';
import { colors, radius, type } from '../theme';

const STEPS = [
  'Checking active vendors against GST records',
  'Checking Udyam / MSME registration status',
  'Cross-matching vendor names and GSTINs across plants',
  'Finalizing Trust Profiles',
];

const STEP_MS = 1200;

export default function SyncProgress() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    markSyncedThisSession();
    const timers: number[] = STEPS.map((_, i) =>
      window.setTimeout(() => setStepIndex(i + 1), (i + 1) * STEP_MS),
    );
    timers.push(window.setTimeout(() => navigate('/dashboard', { replace: true }), STEPS.length * STEP_MS + 500));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [navigate]);

  const progressPct = Math.min(100, (stepIndex / STEPS.length) * 100);
  const currentLabel = STEPS[Math.min(stepIndex, STEPS.length - 1)];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: colors.page,
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ ...type.h2, fontSize: 20, margin: '0 0 8px', color: colors.ink }}>
          Building your Trust Profiles
        </h1>
        <p style={{ color: colors.muted, fontSize: 13.5, margin: '0 0 18px' }}>{currentLabel}</p>

        <div style={{ height: 8, borderRadius: radius.pill, background: '#EDEFF3', overflow: 'hidden', marginBottom: 8 }}>
          <div
            style={{
              height: '100%',
              borderRadius: radius.pill,
              background: colors.primary.gradient,
              width: `${progressPct}%`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <p style={{ color: colors.faint, fontSize: 12, margin: '0 0 26px' }}>This usually takes a few seconds</p>

        <Card padding={22} style={{ textAlign: 'left' }} hoverLift={false}>
          {STEPS.map((label, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: i < STEPS.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    background: done ? '#E7F2EF' : current ? colors.primary[50] : '#F4F4F5',
                    color: done ? colors.success : current ? colors.primary[600] : colors.faint,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                </span>
                <span style={{ fontSize: 13, color: done || current ? colors.ink : colors.faint, fontWeight: current ? 700 : 500 }}>
                  {label}
                </span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
