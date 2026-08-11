import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { colors, radius, shadow, spacing, cardHoverLift } from '../theme';

// Shared surface used across every screen — soft layered shadow instead of a
// flat border, consistent radius/padding, subtle hover lift. Screens that
// need a denser or wider card can override padding/style via props rather
// than reimplementing the surface from scratch.
export default function Card({
  children,
  padding = spacing.cardPadding,
  hoverLift = true,
  style,
}: {
  children: ReactNode;
  padding?: number;
  hoverLift?: boolean;
  style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hoverLift && setHovered(true)}
      onMouseLeave={() => hoverLift && setHovered(false)}
      style={{
        background: colors.surface,
        borderRadius: radius.lg,
        padding,
        boxShadow: hovered ? shadow.cardHover : shadow.card,
        transform: hovered ? 'translateY(-2px)' : 'none',
        ...cardHoverLift,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
