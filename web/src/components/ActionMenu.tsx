import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors, radius, shadow, transition } from '../theme';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

export default function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Row actions"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          border: 'none',
          borderRadius: radius.sm - 2,
          background: open ? colors.primary[50] : 'transparent',
          color: open ? colors.primary[600] : colors.faint,
          cursor: 'pointer',
          transition: `background ${transition.base}, color ${transition.base}`,
        }}
      >
        <MoreVertical size={16} strokeWidth={2.25} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 200,
            background: colors.surface,
            borderRadius: radius.sm,
            boxShadow: shadow.popover,
            padding: 6,
            zIndex: 30,
          }}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            const isHovered = hovered === i && !item.disabled;
            return (
              <div
                key={item.label}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick();
                  setOpen(false);
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: radius.sm - 2,
                  fontSize: 13,
                  cursor: item.disabled ? 'default' : 'pointer',
                  color: item.disabled ? '#C7CCD4' : colors.slate,
                  background: isHovered ? colors.primary[50] : 'transparent',
                  transition: `background ${transition.base}`,
                }}
              >
                {Icon && <Icon size={14} strokeWidth={2.25} />}
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
