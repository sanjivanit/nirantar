import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ApiError } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/vendors');
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
        background: '#0A1A30',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 36,
            justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
            <path
              d="M11 8C6.58 8 3 11.58 3 16C3 20.42 6.58 24 11 24C15 24 17.5 21 19 18"
              stroke="#1B3A5C"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <path
              d="M21 24C25.42 24 29 20.42 29 16C29 11.58 25.42 8 21 8C17 8 14.5 11 13 14"
              stroke="#2E7D6B"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>Nirantar</div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '1px solid #E4E7EC',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.2px', color: '#131B2E' }}>
            Welcome back
          </h1>
          <p style={{ color: '#5B6472', fontSize: 13, margin: '0 0 22px' }}>Your Finance &amp; Compliance workspace</p>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#131B2E', marginBottom: 6 }}>Work email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@suryodaya-auto.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E4E7EC',
              borderRadius: 8,
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          <div style={{ fontSize: 12, fontWeight: 600, color: '#131B2E', marginBottom: 6 }}>Password</div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${error ? '#B23A3A' : '#E4E7EC'}`,
              borderRadius: 8,
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 6,
              boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ color: '#B23A3A', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ height: error ? 0 : 16 }} />

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: 12,
              border: 'none',
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
              background: '#1B3A5C',
              color: '#fff',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 11.5, margin: '18px 0 0' }}>
          Trusted by Finance teams managing more than one plant.
        </p>
      </div>
    </div>
  );
}
