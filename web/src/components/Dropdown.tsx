import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
          border: `1px solid ${open ? '#1B3A5C' : '#E4E7EC'}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'inherit',
          background: '#fff',
          color: '#131B2E',
          cursor: 'pointer',
        }}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          style={{
            color: '#8A93A3',
            flex: 'none',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
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
            background: '#fff',
            border: '1px solid #E4E7EC',
            borderRadius: 8,
            boxShadow: '0 8px 20px rgba(16,24,40,0.10)',
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
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#131B2E' : '#3D4552',
                  background: isSelected ? '#EEF1F5' : isHovered ? '#F6F7F9' : 'transparent',
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
