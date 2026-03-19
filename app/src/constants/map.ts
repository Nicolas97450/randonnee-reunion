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

// Carte IGN Plan v2 — LA reference rando France + Reunion
export const MAP_STYLE_IGN = {
  version: 8 as const,
  sources: {
    'ign-plan': {
      type: 'raster' as const,
      tiles: [
        'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      ],
      tileSize: 256,
      attribution: 'IGN',
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: 'ign-plan-layer',
      type: 'raster' as const,
      source: 'ign-plan',
    },
  ],
};

// Vue satellite IGN Orthophotos
export const MAP_STYLE_SATELLITE = {
  version: 8 as const,
  sources: {
    'ign-ortho': {
      type: 'raster' as const,
      tiles: [
        'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      ],
      tileSize: 256,
      attribution: 'IGN',
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: 'ign-ortho-layer',
      type: 'raster' as const,
      source: 'ign-ortho',
    },
  ],
};

// Style carte sombre (basé sur les tuiles OSM libres)
export const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
export const MAP_STYLE_POSITRON = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Par defaut : Positron (vectoriel, overlays MapLibre fonctionnent parfaitement)
// IGN et Satellite sont des styles raster — les overlays peuvent avoir des soucis de z-order sur Android
export const MAP_STYLE_LIGHT = MAP_STYLE_POSITRON;

// Couleurs des sentiers par difficulté sur la carte
export const TRAIL_LINE_COLORS: Record<string, string> = {
  facile: COLORS.easy,
  moyen: COLORS.medium,
  difficile: COLORS.hard,
  expert: COLORS.expert,
};

export const TRAIL_LINE_WIDTH = 3;
