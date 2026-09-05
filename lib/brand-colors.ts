/** Couleurs runtime (graphiques, SVG). Les hex vivent uniquement dans `app/globals.css`. */
export const brand = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  bg: "var(--color-bg)",
  bgAlt: "var(--color-bg-alt)",
  bgDark: "var(--color-bg-dark)",
  text: "var(--color-text)",
  textDark: "var(--color-text-dark)",
  textMuted: "var(--color-text-muted)",
  border: "var(--color-border)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
} as const;

export const ACCENT = brand.accent;
