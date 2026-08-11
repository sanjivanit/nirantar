import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { colors, radius, shadow, transition } from '../theme';

export interface DropdownOption {
  value: string;
  label: string;
}

export default function Dropdown({
  value,
  options,
  onChange,
  minWidth = 150,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 10px 10px 12px',
          border: `1px solid ${open ? colors.primary[600] : colors.border}`,
          borderRadius: radius.sm,
          fontSize: 13,
          fontFamily: 'inherit',
          background: '#fff',
          color: colors.ink,
          cursor: 'pointer',
          boxShadow: open ? `0 0 0 3px ${colors.primary[100]}` : 'none',
          transition: `border-color ${transition.base}, box-shadow ${transition.base}`,
        }}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          style={{
            color: colors.faint,
            flex: 'none',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: `transform ${transition.base}`,
          }}
        />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: colors.surface,
            borderRadius: radius.sm,
            boxShadow: shadow.popover,
            padding: 6,
            zIndex: 20,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            const isHovered = hovered === o.value;
            return (
              <div
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHovered(o.value)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '8px 10px',
                  borderRadius: radius.sm - 2,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? colors.primary[600] : colors.slate,
                  background: isSelected ? colors.primary[50] : isHovered ? colors.divider : 'transparent',
                  transition: `background ${transition.base}`,
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
