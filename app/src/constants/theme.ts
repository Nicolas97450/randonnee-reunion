import { Dimensions, PixelRatio } from 'react-native';

// Base de reference : ecran de 375pt de large (iPhone SE / petit Android)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;

// Fonction de mise a l'echelle qui s'adapte a la taille de l'ecran
// Sur petit tel (320px) : reduit les tailles
// Sur grand tel (428px) : augmente legerement
// Plafonne pour ne pas etre trop gros sur tablettes
function s(size: number): number {
  const scaled = size * Math.min(scale, 1.15); // max +15% sur grands ecrans
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

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

  // Brand — Foret reunionnaise
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
  xs: s(4),
  sm: s(8),
  md: s(16),
  lg: s(24),
  xl: s(32),
  xxl: s(48),
} as const;

export const FONT_SIZE = {
  xs: s(11),
  sm: s(13),
  md: s(15),
  lg: s(17),
  xl: s(20),
  xxl: s(24),
  xxxl: s(28),
} as const;

export const BORDER_RADIUS = {
  sm: s(8),
  md: s(12),
  lg: s(16),
  xl: s(20),
  full: 9999,
} as const;
