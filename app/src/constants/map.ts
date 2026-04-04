import { COLORS } from './theme';

// Centre geographique de La Reunion (vue carte par defaut uniquement)
// NE PAS utiliser comme fallback pour les coordonnees de sentiers
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

// Styles Mapbox (vectoriels, overlays fonctionnent parfaitement)
export const MAP_STYLE_OUTDOORS = 'mapbox://styles/mapbox/outdoors-v12'; // Relief + courbes de niveau + sentiers
export const MAP_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12'; // Satellite + noms de rues
export const MAP_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11'; // Clair type Positron
export const MAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11'; // Mode nuit

// Par defaut : Outdoors (LA carte rando — relief, courbes, sentiers)
export const MAP_STYLE_DEFAULT = MAP_STYLE_OUTDOORS;

// Couleurs des sentiers par difficulté sur la carte
export const TRAIL_LINE_COLORS: Record<string, string> = {
  facile: COLORS.easy,
  moyen: COLORS.medium,
  difficile: COLORS.hard,
  expert: COLORS.expert,
};

export const TRAIL_LINE_WIDTH = 3;
