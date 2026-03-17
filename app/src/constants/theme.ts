export const COLORS = {
  // Base — Nuit tropicale / Roche volcanique
  background: '#0c0a09',
  surface: '#1c1917',
  surfaceLight: '#292524',
  card: '#1c1917',

  // Text
  textPrimary: '#fafaf9',
  textSecondary: '#a8a29e',
  textMuted: '#8a8178',

  // Brand — Forêt réunionnaise
  primary: '#14532d',
  primaryLight: '#22c55e',
  primaryDark: '#166534',

  // Accent chaud — Volcan
  warm: '#d97706',

  // Difficulty badges
  easy: '#22c55e',
  medium: '#d97706',
  hard: '#dc2626',
  expert: '#7c3aed',

  // Trail status
  statusOpen: '#22c55e',
  statusClosed: '#dc2626',
  statusDegraded: '#f59e0b',
  statusUnknown: '#78716c',

  // UI
  border: '#292524',
  white: '#fafaf9',
  black: '#0c0a09',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#3b82f6',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
