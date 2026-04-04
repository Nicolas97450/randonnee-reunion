import { Dimensions, PixelRatio, Platform } from 'react-native';

// Base de reference : ecran de 375pt de large (iPhone SE / petit Android)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;

// Fonction de mise a l'echelle responsive
function s(size: number): number {
  const scaled = size * Math.min(scale, 1.15);
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

  // Gamification badges
  silver: '#94a3b8',
  gold: '#ffd700',
  pink: '#ec4899',
  cyan: '#22d3ee',
  teal: '#14b8a6',
  sky: '#0ea5e9',

  // UI
  border: '#292524',
  white: '#fafaf9',
  black: '#0c0a09',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#3b82f6',

  // Medals
  bronze: '#CD7F32',

  // POI colors
  poiFood: '#f97316',
  poiWater: '#06b6d4',
  poiWaterfall: '#1d4ed8',

  // Report type colors
  reportMud: '#92400E',
  reportTree: '#065F46',
  reportWater: '#1E40AF',
  reportFog: '#6B7280',
  reportSlippery: '#D97706',
  reportRockfall: '#DC2626',
  reportSnow: '#60A5FA',
  reportDanger: '#DC2626',
  reportDegraded: '#F59E0B',
  reportMissing: '#8B5CF6',
  reportOther: '#6B7280',

  // Cyclone alert levels
  cycloneGreen: '#22c55e',
  cycloneYellow: '#f59e0b',
  cycloneOrange: '#f97316',
  cycloneRed: '#dc2626',

  // Notification colors
  notifFriendRequest: '#f59e0b',
  notifFriendAccepted: '#22c55e',
  notifDM: '#3b82f6',
  notifSortie: '#f97316',

  // [UX-2] Semantic colors
  overlay: 'rgba(0,0,0,0.6)',
  overlayDark: 'rgba(0,0,0,0.7)',
  overlayHeavy: 'rgba(0,0,0,0.9)',
  overlayLight: 'rgba(0,0,0,0.5)',
  interactive: '#22c55e',
  interactiveDisabled: '#3f3f46',
} as const;

// Zone colors for gamification (18 zones)
export const ZONE_COLORS = {
  mafate: '#2ECC71',
  cilaos: '#3498DB',
  salazie: '#9B59B6',
  volcan: '#1ABC9C',
  pitonNeiges: '#E74C3C',
  coteOuest: '#F39C12',
  coteEst: '#27AE60',
  sudSauvage: '#2C3E50',
  zone9: '#E67E22',
  zone10: '#16A085',
  zone11: '#8E44AD',
  zone12: '#D35400',
  zone13: '#C0392B',
  zone14: '#2980B9',
  zone15: '#7F8C8D',
  zone16: '#006400',
  zone17: '#4A90D9',
  zone18: '#5D4E37',
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

// [UX-2] Elevation / shadow system
export const ELEVATION = {
  none: {},
  raised: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
    android: { elevation: 3 },
  }) ?? {},
  floating: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
    android: { elevation: 6 },
  }) ?? {},
  modal: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
    android: { elevation: 12 },
  }) ?? {},
} as const;

// [UX-2] Animation timing constants (for Reanimated)
export const ANIM = {
  SPRING_ENTER: { damping: 15, stiffness: 150 },
  SPRING_PRESS: { damping: 20, stiffness: 300 },
  SPRING_BOUNCE: { damping: 10, stiffness: 120 },
  FADE_DURATION: 300,
  STAGGER_DELAY: 80,
} as const;
