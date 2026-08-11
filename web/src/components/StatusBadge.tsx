import { Check, ArrowLeftRight, AlertTriangle, Clock, Ban, Flag, type LucideIcon } from 'lucide-react';
import type { VendorStatus } from '../types';
import { statusColors, radius } from '../theme';

export const STATUS_META: Record<VendorStatus, { bg: string; fg: string; border: string; icon: LucideIcon; label: string }> = {
  verified: { ...statusColors.verified, icon: Check, label: 'Verified' },
  changed: { ...statusColors.changed, icon: ArrowLeftRight, label: 'Changed' },
  conflict: { ...statusColors.conflict, icon: AlertTriangle, label: 'Conflict' },
  stale: { ...statusColors.stale, icon: Clock, label: 'Stale' },
  unavailable: { ...statusColors.unavailable, icon: Ban, label: 'Unavailable' },
  review_required: { ...statusColors.review_required, icon: Flag, label: 'Review required' },
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
        borderRadius: radius.pill,
        fontSize: compact ? 11.5 : 12,
        fontWeight: 600,
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
