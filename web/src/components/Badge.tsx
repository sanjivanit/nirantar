import type { LucideIcon } from 'lucide-react';
import { radius } from '../theme';

// Single shared pill for every status/severity indicator in the app —
// vendor states (StatusBadge), alert severity, alert status, MSME row
// status. `icon` is required on purpose: color alone must never be the only
// signal, so there's no way to render one of these without an icon.
export interface BadgeProps {
  bg: string;
  fg: string;
  border: string;
  icon: LucideIcon;
  label: string;
  compact?: boolean;
}

export default function Badge({ bg, fg, border, icon: Icon, label, compact }: BadgeProps) {
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
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
      }}
    >
      <Icon size={compact ? 13 : 15} strokeWidth={2.25} />
      {label}
    </span>
  );
}
