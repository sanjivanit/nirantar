// Shared design tokens for the "design-refresh" visual pass. The codebase is
// deliberately inline-styled with no CSS files (see index.css) — this module
// is the single source of truth for the values that must stay consistent
// across every screen (colors, radius, shadow, spacing, type scale), so
// screens still import discrete values rather than a CSS framework.

export const colors = {
  // Primary brand — indigo/purple, replaces the old navy (#1B3A5C / #131B2E).
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    sidebarGradient: 'linear-gradient(180deg, #3730A3 0%, #4F46E5 100%)',
  },

  // Neutrals — unchanged from the existing palette, kept as tokens so
  // screens reference one place instead of repeating hex values.
  ink: '#131B2E', // headings / primary text
  slate: '#3D4552', // secondary text, slightly bolder
  muted: '#5B6472', // tertiary text
  faint: '#8A93A3', // captions, metadata
  border: '#E4E7EC',
  borderSubtle: '#F0F2F5',
  divider: '#F7F8FA',
  surface: '#fff',
  surfaceSunk: '#F7F8FA',
  page: '#F6F7F9',

  // Severity — untouched in meaning (red = critical/overdue, amber = warning).
  danger: '#B23A3A',
  warning: '#C48A2E',
  success: '#2E7D6B',
} as const;

// Six vendor-state colors. Functional, not decorative: users make real
// decisions telling these apart, so every hue must stay clearly separated
// from the other five AND from the new indigo primary (colors.primary).
// `review_required` previously used a muted purple (#6B5B95) which sits far
// too close to the new indigo brand color — moved to rose/magenta, the one
// hue family not already in use, to keep all six + primary maximally
// distinguishable at a glance.
export const statusColors = {
  verified: { bg: '#E7F2EF', fg: '#2E7D6B', border: '#B7DBD2' }, // green
  changed: { bg: '#FBF1E1', fg: '#C48A2E', border: '#EBD3A3' }, // amber
  conflict: { bg: '#F8E9E9', fg: '#B23A3A', border: '#E9BFBF' }, // red
  stale: { bg: '#EEF0F3', fg: '#8A94A6', border: '#D8DCE3' }, // cool gray
  unavailable: { bg: '#E9EBEF', fg: '#5B6472', border: '#C3CAD6' }, // slate gray
  review_required: { bg: '#FBEAF2', fg: '#A23E70', border: '#EFC7DC' }, // rose
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const shadow = {
  // Soft, layered elevation — replaces flat `1px solid border` cards.
  card: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -8px rgba(16,24,40,0.08)',
  cardHover: '0 2px 4px rgba(16,24,40,0.05), 0 16px 32px -8px rgba(79,70,229,0.14)',
  popover: '0 8px 24px rgba(16,24,40,0.12)',
} as const;

export const spacing = {
  cardPadding: 24,
  cardGap: 20,
};

// Standard size for chart/gauge visuals inside a card, so any future chart
// card starts from the same footprint instead of a page-local magic number.
export const chart = {
  gaugeSize: 140,
};

// Consistent type scale used across every screen.
export const type = {
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.4px' },
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.2px' },
  cardTitle: { fontSize: 13.5, fontWeight: 700 },
  body: { fontSize: 13, fontWeight: 400 },
  label: { fontSize: 12, fontWeight: 600 },
  caption: { fontSize: 11.5, fontWeight: 500 },
  stat: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' },
} as const;

export const transition = {
  base: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Standard hover-lift for cards — subtle translate + shadow swap.
export const cardHoverLift = {
  transition: `transform ${transition.base}, box-shadow ${transition.base}`,
};

// Standard column-label row above every data table's body rows. Spread this
// into the header row's style, then add `padding` locally — that's the one
// property with a real reason to vary: full-bleed card-as-table screens
// (Vendors, MsmeDeadlines, AuditTrail, Reports) use a larger inset; tables
// nested inside an already-padded Card (VendorProfile, Settings, Dashboard's
// Plant breakdown) use a smaller one since the Card provides the outer
// padding already.
export const tableHeader = {
  fontSize: 11.5,
  fontWeight: 700,
  color: colors.faint,
  background: colors.surfaceSunk,
  borderBottom: `1px solid ${colors.border}`,
} as const;
