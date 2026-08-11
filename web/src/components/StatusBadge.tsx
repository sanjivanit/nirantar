import { Check, ArrowLeftRight, AlertTriangle, Clock, Ban, Flag, type LucideIcon } from 'lucide-react';
import type { VendorStatus } from '../types';
import { statusColors } from '../theme';
import Badge from './Badge';

export const STATUS_META: Record<VendorStatus, { bg: string; fg: string; border: string; icon: LucideIcon; label: string }> = {
  verified: { ...statusColors.verified, icon: Check, label: 'Verified' },
  changed: { ...statusColors.changed, icon: ArrowLeftRight, label: 'Changed' },
  conflict: { ...statusColors.conflict, icon: AlertTriangle, label: 'Conflict' },
  stale: { ...statusColors.stale, icon: Clock, label: 'Stale' },
  unavailable: { ...statusColors.unavailable, icon: Ban, label: 'Unavailable' },
  review_required: { ...statusColors.review_required, icon: Flag, label: 'Review required' },
};

export default function StatusBadge({ status, compact }: { status: VendorStatus; compact?: boolean }) {
  return <Badge {...STATUS_META[status]} compact={compact} />;
}
