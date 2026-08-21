// Design System Foundation (Batch 01).
// This formalizes the visual language already in use across the Command
// Centre -- it does not introduce a new identity. Every value here matches
// what AdminShell/login/dashboard pages already render today.

export const colors = {
  bg:        "#080F25", // page background
  surface:   "#060E2A", // sidebar / cards / topbar
  border:    "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  primary:   "#C9A84C", // gold -- primary actions, active states
  primaryText: "#060E2A",
  textHi:    "#FFFFFF",
  textMed:   "rgba(226,232,240,0.7)",
  textLow:   "rgba(226,232,240,0.5)",
  textFaint: "rgba(226,232,240,0.35)",
  success:   "#34D399",
  warning:   "#FBBF24",
  danger:    "#F87171",
  info:      "#60A5FA",
} as const;

export const font = {
  sans: "'Plus Jakarta Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

// H1/H2/H3/Body/Small -- matches the wireframe's typography sample.
export const type = {
  h1:    { fontSize: "2rem",    fontWeight: 700, lineHeight: 1.25 },
  h2:    { fontSize: "1.5rem",  fontWeight: 600, lineHeight: 1.33 },
  h3:    { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
  body:  { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.43 },
  small: { fontSize: "0.75rem",  fontWeight: 400, lineHeight: 1.33 },
} as const;

// 4/8/12/16/24/32/48 spacing scale.
export const spacing = [4, 8, 12, 16, 24, 32, 48] as const;
// 4/8/12/16/24/32 radius scale.
export const radius = [4, 8, 12, 16, 24, 32] as const;
