export const COLORS = {
  // Base
  background: '#1A1A2E',
  surface: '#16213E',
  surfaceLight: '#0F3460',
  card: '#1E2A47',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',

  // Brand
  primary: '#16A34A',
  primaryLight: '#4ADE80',
  primaryDark: '#15803D',

  // Difficulty badges
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
  expert: '#8B5CF6',

  // Trail status
  statusOpen: '#22C55E',
  statusClosed: '#EF4444',
  statusDegraded: '#F59E0B',
  statusUnknown: '#6B7280',

  // UI
  border: '#2D3748',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
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
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
