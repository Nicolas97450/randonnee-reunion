import { useThemeStore, DARK_COLORS, LIGHT_COLORS } from '@/stores/themeStore';

export function useThemeColors() {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
