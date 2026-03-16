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

// Light theme colors
export const LIGHT_COLORS = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceLight: '#F0F2F5',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#4A5568',
  textMuted: '#A0AEC0',
  border: '#E2E8F0',
  primary: '#16A34A',
  primaryLight: '#4ADE80',
  primaryDark: '#15803D',
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
  expert: '#8B5CF6',
  statusOpen: '#22C55E',
  statusClosed: '#EF4444',
  statusDegraded: '#F59E0B',
  statusUnknown: '#6B7280',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
} as const;

export const DARK_COLORS = {
  background: '#1A1A2E',
  surface: '#16213E',
  surfaceLight: '#0F3460',
  card: '#1E2A47',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  border: '#2D3748',
  primary: '#16A34A',
  primaryLight: '#4ADE80',
  primaryDark: '#15803D',
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
  expert: '#8B5CF6',
  statusOpen: '#22C55E',
  statusClosed: '#EF4444',
  statusDegraded: '#F59E0B',
  statusUnknown: '#6B7280',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
} as const;
