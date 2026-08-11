import { Check, ArrowLeftRight, AlertTriangle, Clock, Ban, Flag, type LucideIcon } from 'lucide-react';
import type { VendorStatus } from '../types';

export const STATUS_META: Record<VendorStatus, { bg: string; fg: string; border: string; icon: LucideIcon; label: string }> = {
  verified: { bg: '#E7F2EF', fg: '#2E7D6B', border: '#B7DBD2', icon: Check, label: 'Verified' },
  changed: { bg: '#FBF1E1', fg: '#C48A2E', border: '#EBD3A3', icon: ArrowLeftRight, label: 'Changed' },
  conflict: { bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF', icon: AlertTriangle, label: 'Conflict' },
  stale: { bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3', icon: Clock, label: 'Stale' },
  unavailable: { bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3', icon: Ban, label: 'Unavailable' },
  review_required: { bg: '#EEEBF4', fg: '#6B5B95', border: '#D6CEE6', icon: Flag, label: 'Review required' },
};

export default function StatusBadge({ status, compact }: { status: VendorStatus; compact?: boolean }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 5 : 6,
        padding: compact ? '3px 9px' : '4px 10px',
        borderRadius: 20,
        fontSize: compact ? 11.5 : 12,
        fontWeight: 500,
        background: meta.bg,
        color: meta.fg,
        border: `1px solid ${meta.border}`,
      }}
    >
      <Icon size={compact ? 13 : 15} strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}
