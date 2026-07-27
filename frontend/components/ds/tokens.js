/* ==========================================================================
   SYNCOPTRAC DESIGN SYSTEM - TOKENS

   Single source of truth for the redesign. Screens import from here instead
   of hard-coding hexes, so a palette change is one edit rather than thirty.

   Exported twice on purpose:
     T        - JS object, for inline styles and SVG stroke/fill props
     CSS_VARS - the same values as CSS custom properties

   Every variable is prefixed --sc- so it can never collide with the existing
   globals.css or with Tailwind's own custom properties.
   ========================================================================== */

export const T = {
  /* -- Core palette ------------------------------------------------------ */
  navy: '#0B1F4D',      // primary - dark surfaces, masthead, dock
  accent: '#2563EB',    // primary accent - actions, active states
  accent2: '#3B82F6',   // secondary accent - gradients, hover
  bg: '#F8FAFC',        // app canvas
  card: '#FFFFFF',
  hover: '#EFF6FF',
  border: '#E5E7EB',
  text: '#111827',
  muted: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  /* Brand cyan is retained for the wordmark only - it is not a UI accent. */
  brandCyan: '#5CE1E6',

  /* -- Derived tints ----------------------------------------------------- */
  /* Written as explicit rgba rather than color-mix(): Safari only supports
     color-mix from 16.2 and older iPhones fell back to transparent, which
     silently erased tinted backgrounds on this app once before. */
  accentTint: 'rgba(37, 99, 235, 0.08)',
  accentTintStrong: 'rgba(37, 99, 235, 0.14)',
  accentRing: 'rgba(37, 99, 235, 0.18)',
  successTint: 'rgba(34, 197, 94, 0.10)',
  warningTint: 'rgba(245, 158, 11, 0.12)',
  dangerTint: 'rgba(239, 68, 68, 0.10)',
  navyTint: 'rgba(11, 31, 77, 0.06)',

  /* -- Radii ------------------------------------------------------------- */
  rSm: '10px',
  rMd: '14px',
  rLg: '18px',
  rXl: '24px',
  rPill: '999px',

  /* -- Elevation - tinted with navy, never neutral grey ------------------ */
  sh1: '0 1px 2px rgba(11,31,77,0.04), 0 1px 3px rgba(11,31,77,0.06)',
  sh2: '0 2px 4px rgba(11,31,77,0.04), 0 4px 12px rgba(11,31,77,0.06)',
  sh3: '0 4px 8px rgba(11,31,77,0.05), 0 12px 28px rgba(11,31,77,0.08)',
  sh4: '0 8px 16px rgba(11,31,77,0.06), 0 24px 48px rgba(11,31,77,0.10)',
  shAccent: '0 8px 20px rgba(37,99,235,0.24)',

  /* -- Motion ------------------------------------------------------------ */
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',           // decelerate - default
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // slight overshoot
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  dFast: '160ms',
  dBase: '240ms',
  dSlow: '420ms',

  /* -- Type scale -------------------------------------------------------- */
  /* clamp() so type scales continuously instead of jumping at breakpoints. */
  fDisplay: 'clamp(1.75rem, 4.4vw, 2.5rem)',
  fH1: 'clamp(1.5rem, 3.6vw, 2rem)',
  fH2: 'clamp(1.2rem, 2.6vw, 1.5rem)',
  fH3: '1.0625rem',
  fBody: '0.9375rem',
  fSm: '0.875rem',
  fXs: '0.8125rem',
  fMicro: '0.6875rem',

  /* -- Layout ------------------------------------------------------------ */
  maxW: '1240px',
  tap: '44px', // minimum touch target
};

/* Chart series colours, in the order recharts should consume them. */
export const SERIES = [T.accent, T.accent2, T.success, T.warning, T.danger, T.navy];

/* Status -> visual mapping, shared by badges, chips and table cells so a
   "paid" pill looks identical in both portals and on every screen. */
export const STATUS = {
  paid:      { label: 'Paid',      fg: '#15803D', bg: 'rgba(34,197,94,0.12)',   dot: T.success },
  present:   { label: 'Present',   fg: '#15803D', bg: 'rgba(34,197,94,0.12)',   dot: T.success },
  active:    { label: 'Active',    fg: '#15803D', bg: 'rgba(34,197,94,0.12)',   dot: T.success },
  converted: { label: 'Converted', fg: '#15803D', bg: 'rgba(34,197,94,0.12)',   dot: T.success },
  pending:   { label: 'Pending',   fg: '#B45309', bg: 'rgba(245,158,11,0.14)',  dot: T.warning },
  followup:  { label: 'Follow-Up', fg: '#B45309', bg: 'rgba(245,158,11,0.14)',  dot: T.warning },
  overdue:   { label: 'Overdue',   fg: '#B91C1C', bg: 'rgba(239,68,68,0.12)',   dot: T.danger },
  absent:    { label: 'Absent',    fg: '#B91C1C', bg: 'rgba(239,68,68,0.12)',   dot: T.danger },
  inactive:  { label: 'Inactive',  fg: '#4B5563', bg: 'rgba(107,114,128,0.12)', dot: T.muted },
  new:       { label: 'New',       fg: '#1D4ED8', bg: 'rgba(37,99,235,0.10)',   dot: T.accent },
};

/* Small helpers used across screens, kept here so they stay consistent. */
export const inr = (n) => (n ?? 0).toLocaleString('en-IN');
export const delay = (s) => ({ animationDelay: s + 's' });
export const tone = (c, i = 0) => ({ '--sc-tone': c, animationDelay: i * 0.05 + 's' });

/* CSS custom properties - injected once by <DesignSystem />. */
export const CSS_VARS = `
  --sc-navy: ${T.navy};
  --sc-accent: ${T.accent};
  --sc-accent-2: ${T.accent2};
  --sc-bg: ${T.bg};
  --sc-card: ${T.card};
  --sc-hover: ${T.hover};
  --sc-border: ${T.border};
  --sc-text: ${T.text};
  --sc-muted: ${T.muted};
  --sc-success: ${T.success};
  --sc-warning: ${T.warning};
  --sc-danger: ${T.danger};
  --sc-brand-cyan: ${T.brandCyan};
  --sc-accent-tint: ${T.accentTint};
  --sc-accent-tint-strong: ${T.accentTintStrong};
  --sc-accent-ring: ${T.accentRing};
  --sc-success-tint: ${T.successTint};
  --sc-warning-tint: ${T.warningTint};
  --sc-danger-tint: ${T.dangerTint};
  --sc-navy-tint: ${T.navyTint};
  --sc-r-sm: ${T.rSm};
  --sc-r-md: ${T.rMd};
  --sc-r-lg: ${T.rLg};
  --sc-r-xl: ${T.rXl};
  --sc-r-pill: ${T.rPill};
  --sc-sh-1: ${T.sh1};
  --sc-sh-2: ${T.sh2};
  --sc-sh-3: ${T.sh3};
  --sc-sh-4: ${T.sh4};
  --sc-sh-accent: ${T.shAccent};
  --sc-ease: ${T.ease};
  --sc-ease-spring: ${T.easeSpring};
  --sc-ease-in-out: ${T.easeInOut};
  --sc-d-fast: ${T.dFast};
  --sc-d-base: ${T.dBase};
  --sc-d-slow: ${T.dSlow};
  --sc-f-display: ${T.fDisplay};
  --sc-f-h1: ${T.fH1};
  --sc-f-h2: ${T.fH2};
  --sc-f-h3: ${T.fH3};
  --sc-f-body: ${T.fBody};
  --sc-f-sm: ${T.fSm};
  --sc-f-xs: ${T.fXs};
  --sc-f-micro: ${T.fMicro};
  --sc-max-w: ${T.maxW};
  --sc-tap: ${T.tap};
`;

export default T;
