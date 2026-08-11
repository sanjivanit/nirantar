import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ApiError } from '../api';
import { hasSyncedThisSession } from '../syncSession';
import { colors, radius, shadow, transition } from '../theme';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(hasSyncedThisSession() ? '/vendors' : '/sync');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("That password doesn't match. Give it another try.");
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: colors.primary.sidebarGradient,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: colors.surface,
            borderRadius: radius.lg,
            padding: 36,
            boxShadow: shadow.popover,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            <svg viewBox="0 0 32 32" width="46" height="46" fill="none">
              <path
                d="M11 8C6.58 8 3 11.58 3 16C3 20.42 6.58 24 11 24C15 24 17.5 21 19 18"
                stroke={colors.primary[600]}
                strokeWidth="3.6"
                strokeLinecap="round"
              />
              <path
                d="M21 24C25.42 24 29 20.42 29 16C29 11.58 25.42 8 21 8C17 8 14.5 11 13 14"
                stroke={colors.success}
                strokeWidth="3.6"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ color: colors.primary[600], fontWeight: 700, fontSize: 24 }}>Nirantar</div>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px', color: colors.ink, textAlign: 'center' }}>
            Welcome back
          </h1>
          <p style={{ color: colors.muted, fontSize: 13, margin: '0 0 22px', textAlign: 'center' }}>Your Finance &amp; Compliance workspace</p>

          <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>Work email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="you@suryodaya-auto.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${emailFocused ? colors.primary[600] : colors.border}`,
              borderRadius: radius.sm,
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 16,
              boxSizing: 'border-box',
              boxShadow: emailFocused ? `0 0 0 3px ${colors.primary[100]}` : 'none',
              transition: `border-color ${transition.base}, box-shadow ${transition.base}`,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>Password</div>
            <button
              type="button"
              onClick={() => setNotice('Contact your workspace admin to reset your password.')}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: colors.primary[600], fontSize: 12, fontWeight: 600 }}
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="••••••••••"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${error ? colors.danger : passwordFocused ? colors.primary[600] : colors.border}`,
              borderRadius: radius.sm,
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 6,
              boxSizing: 'border-box',
              boxShadow: passwordFocused && !error ? `0 0 0 3px ${colors.primary[100]}` : 'none',
              transition: `border-color ${transition.base}, box-shadow ${transition.base}`,
            }}
          />
          {error && <div style={{ color: colors.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ height: error ? 0 : 16 }} />

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: 12,
              border: 'none',
              borderRadius: radius.sm + 1,
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
              background: colors.primary.gradient,
              color: '#fff',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
            <span style={{ color: colors.faint, fontSize: 11.5, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
          </div>

          <button
            type="button"
            onClick={() => setNotice('Single Sign-On is not configured for this workspace yet.')}
            style={{
              width: '100%',
              padding: 11,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm + 1,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#fff',
              color: colors.ink,
            }}
          >
            Continue with Single Sign-On
          </button>

          {notice && <div style={{ color: colors.muted, fontSize: 12, marginTop: 14, textAlign: 'center' }}>{notice}</div>}
        </form>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 11.5, margin: '18px 0 0' }}>
          Trusted by Finance teams managing more than one plant.
        </p>
      </div>
    </div>
  );
}
