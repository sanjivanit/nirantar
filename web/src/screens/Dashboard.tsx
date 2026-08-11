import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getVendors } from '../api';
import type { Vendor } from '../types';

export default function Dashboard() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    getVendors().then(setVendors);
  }, []);

  const needsAttention = vendors?.filter((v) => v.status !== 'verified').length ?? 0;
  const verifiedClean = vendors ? vendors.length - needsAttention : 0;

  return (
    <div style={{ padding: '32px 40px 60px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Dashboard</h1>
      <p style={{ color: '#5B6472', fontSize: 13, marginBottom: 20 }}>Full dashboard is Phase 2 — this is a minimal placeholder.</p>

      {vendors && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, maxWidth: 500 }}>
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 }}>
            <div style={{ color: '#5B6472', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Vendors needing attention</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#131B2E', letterSpacing: '-0.5px' }}>{needsAttention}</div>
            <div style={{ color: '#5B6472', fontSize: 12, marginTop: 8 }}>{verifiedClean} verified clean</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 }}>
            <div style={{ color: '#5B6472', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Total vendors</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#131B2E', letterSpacing: '-0.5px' }}>{vendors.length}</div>
            <Link
              to="/vendors"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B3A5C', fontSize: 12, marginTop: 8, fontWeight: 600 }}
            >
              View all <ArrowRight size={13} strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
