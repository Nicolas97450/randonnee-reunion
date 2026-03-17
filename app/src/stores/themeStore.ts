import { create } from 'zustand';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark';
  }
  return mode === 'dark';
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  isDark: resolveIsDark('system'),

  setMode: (mode) => {
    set({ mode, isDark: resolveIsDark(mode) });
  },
}));

// Light theme colors — Brume / Sable
export const LIGHT_COLORS = {
  background: '#fafaf9',
  surface: '#ffffff',
  surfaceLight: '#f5f5f4',
  card: '#ffffff',
  textPrimary: '#1c1917',
  textSecondary: '#44403c',
  textMuted: '#78716c',
  border: '#e7e5e4',
  primary: '#14532d',
  primaryLight: '#22c55e',
  primaryDark: '#166534',
  warm: '#d97706',
  easy: '#16a34a',
  medium: '#d97706',
  hard: '#dc2626',
  expert: '#7c3aed',
  statusOpen: '#16a34a',
  statusClosed: '#dc2626',
  statusDegraded: '#d97706',
  statusUnknown: '#78716c',
  white: '#ffffff',
  black: '#0c0a09',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  info: '#2563eb',
} as const;

// Dark theme colors — Nuit tropicale / Roche volcanique
export const DARK_COLORS = {
  background: '#0c0a09',
  surface: '#1c1917',
  surfaceLight: '#292524',
  card: '#1c1917',
  textPrimary: '#fafaf9',
  textSecondary: '#a8a29e',
  textMuted: '#8a8178',
  border: '#292524',
  primary: '#14532d',
  primaryLight: '#22c55e',
  primaryDark: '#166534',
  warm: '#d97706',
  easy: '#22c55e',
  medium: '#d97706',
  hard: '#dc2626',
  expert: '#7c3aed',
  statusOpen: '#22c55e',
  statusClosed: '#dc2626',
  statusDegraded: '#f59e0b',
  statusUnknown: '#78716c',
  white: '#fafaf9',
  black: '#0c0a09',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#3b82f6',
} as const;
