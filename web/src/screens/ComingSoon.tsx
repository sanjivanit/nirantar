export default function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{label}</h1>
      <p style={{ color: '#5B6472', fontSize: 13.5 }}>Coming in a later phase.</p>
    </div>
  );
}
