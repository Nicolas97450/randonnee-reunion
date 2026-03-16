// Centre de La Réunion
export const REUNION_CENTER = {
  latitude: -21.1151,
  longitude: 55.5364,
};

// Zoom par défaut pour voir toute l'île
export const REUNION_ZOOM = 9.5;

// Zoom détail sentier
export const TRAIL_ZOOM = 13;

// Bbox de La Réunion (pour limiter le pan)
export const REUNION_BOUNDS = {
  ne: [55.85, -20.85] as [number, number],
  sw: [55.20, -21.40] as [number, number],
};

// Style carte sombre (basé sur les tuiles OSM libres)
export const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
export const MAP_STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Couleurs des sentiers par difficulté sur la carte
export const TRAIL_LINE_COLORS: Record<string, string> = {
  facile: '#22C55E',
  moyen: '#F59E0B',
  difficile: '#EF4444',
  expert: '#8B5CF6',
};

export const TRAIL_LINE_WIDTH = 3;
