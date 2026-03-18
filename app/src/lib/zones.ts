// Les 18 zones géographiques de La Réunion pour la gamification
// Polygones simplifiés — en production, utiliser des GeoJSON précis depuis Supabase

export interface MapZone {
  id: string;
  name: string;
  slug: string;
  color: string;
  center: [number, number]; // [lng, lat]
  polygon: [number, number][]; // Simplified polygon points
}

export const ZONES: MapZone[] = [
  {
    id: '1',
    name: 'Cirque de Mafate',
    slug: 'mafate',
    color: '#2ECC71',
    center: [55.42, -21.05],
    polygon: [
      [55.37, -21.02], [55.46, -21.02], [55.47, -21.08],
      [55.43, -21.10], [55.37, -21.08], [55.37, -21.02],
    ],
  },
  {
    id: '2',
    name: 'Cirque de Cilaos',
    slug: 'cilaos',
    color: '#3498DB',
    center: [55.47, -21.13],
    polygon: [
      [55.43, -21.10], [55.52, -21.10], [55.52, -21.17],
      [55.43, -21.17], [55.43, -21.10],
    ],
  },
  {
    id: '3',
    name: 'Cirque de Salazie',
    slug: 'salazie',
    color: '#9B59B6',
    center: [55.52, -21.05],
    polygon: [
      [55.49, -21.02], [55.57, -21.02], [55.57, -21.08],
      [55.49, -21.08], [55.49, -21.02],
    ],
  },
  {
    id: '4',
    name: 'Piton des Neiges',
    slug: 'piton-des-neiges',
    color: '#1ABC9C',
    center: [55.48, -21.10],
    polygon: [
      [55.46, -21.08], [55.50, -21.08], [55.50, -21.11],
      [55.46, -21.11], [55.46, -21.08],
    ],
  },
  {
    id: '5',
    name: 'Massif du Volcan',
    slug: 'volcan',
    color: '#E74C3C',
    center: [55.71, -21.23],
    polygon: [
      [55.64, -21.19], [55.78, -21.19], [55.78, -21.27],
      [55.64, -21.27], [55.64, -21.19],
    ],
  },
  {
    id: '6',
    name: 'Plaine des Cafres',
    slug: 'plaine-des-cafres',
    color: '#F39C12',
    center: [55.57, -21.19],
    polygon: [
      [55.53, -21.16], [55.64, -21.16], [55.64, -21.22],
      [55.53, -21.22], [55.53, -21.16],
    ],
  },
  {
    id: '7',
    name: 'Plaine des Palmistes',
    slug: 'plaine-des-palmistes',
    color: '#27AE60',
    center: [55.62, -21.13],
    polygon: [
      [55.58, -21.10], [55.67, -21.10], [55.67, -21.16],
      [55.58, -21.16], [55.58, -21.10],
    ],
  },
  {
    id: '8',
    name: 'Grand Sud Sauvage',
    slug: 'sud-sauvage',
    color: '#2C3E50',
    center: [55.75, -21.20],
    polygon: [
      [55.68, -21.17], [55.82, -21.17], [55.82, -21.23],
      [55.68, -21.23], [55.68, -21.17],
    ],
  },
  {
    id: '9',
    name: 'Cote Ouest',
    slug: 'cote-ouest',
    color: '#E67E22',
    center: [55.28, -21.05],
    polygon: [
      [55.22, -20.98], [55.35, -20.98], [55.35, -21.12],
      [55.22, -21.12], [55.22, -20.98],
    ],
  },
  {
    id: '10',
    name: 'Cote Est',
    slug: 'cote-est',
    color: '#16A085',
    center: [55.65, -20.98],
    polygon: [
      [55.57, -20.90], [55.72, -20.90], [55.72, -21.05],
      [55.57, -21.05], [55.57, -20.90],
    ],
  },
  {
    id: '11',
    name: 'Nord',
    slug: 'nord',
    color: '#8E44AD',
    center: [55.45, -20.92],
    polygon: [
      [55.38, -20.87], [55.55, -20.87], [55.55, -20.97],
      [55.38, -20.97], [55.38, -20.87],
    ],
  },
  {
    id: '12',
    name: 'Hauts de l\'Ouest',
    slug: 'hauts-ouest',
    color: '#D35400',
    center: [55.33, -21.15],
    polygon: [
      [55.28, -21.10], [55.40, -21.10], [55.40, -21.22],
      [55.28, -21.22], [55.28, -21.10],
    ],
  },
  {
    id: '13',
    name: 'Hauts du Sud',
    slug: 'hauts-sud',
    color: '#C0392B',
    center: [55.52, -21.25],
    polygon: [
      [55.45, -21.20], [55.60, -21.20], [55.60, -21.30],
      [55.45, -21.30], [55.45, -21.20],
    ],
  },
  {
    id: '14',
    name: 'Hauts du Nord-Est',
    slug: 'hauts-nord-est',
    color: '#2980B9',
    center: [55.58, -21.04],
    polygon: [
      [55.55, -21.00], [55.65, -21.00], [55.65, -21.08],
      [55.55, -21.08], [55.55, -21.00],
    ],
  },
  {
    id: '15',
    name: 'Route des Tamarins',
    slug: 'route-tamarins',
    color: '#7F8C8D',
    center: [55.33, -21.08],
    polygon: [
      [55.30, -21.05], [55.38, -21.05], [55.38, -21.12],
      [55.30, -21.12], [55.30, -21.05],
    ],
  },
  {
    id: '16',
    name: 'Foret de Bebour-Belouve',
    slug: 'bebour-belouve',
    color: '#006400',
    center: [55.54, -21.08],
    polygon: [
      [55.50, -21.05], [55.58, -21.05], [55.58, -21.12],
      [55.50, -21.12], [55.50, -21.05],
    ],
  },
  {
    id: '17',
    name: 'Grand Benare',
    slug: 'grand-benare',
    color: '#4A90D9',
    center: [55.40, -21.10],
    polygon: [
      [55.37, -21.07], [55.44, -21.07], [55.44, -21.13],
      [55.37, -21.13], [55.37, -21.07],
    ],
  },
  {
    id: '18',
    name: 'Riviere des Remparts',
    slug: 'riviere-remparts',
    color: '#5D4E37',
    center: [55.62, -21.20],
    polygon: [
      [55.58, -21.17], [55.67, -21.17], [55.67, -21.24],
      [55.58, -21.24], [55.58, -21.17],
    ],
  },
];

// Map trail regions to zone slugs
// Must cover ALL regions from Supabase (710 trails, 11 regions)
export const REGION_TO_ZONE: Record<string, string> = {
  'Cirque de Mafate': 'mafate',
  'Cirque de Cilaos': 'cilaos',
  'Cirque de Salazie': 'salazie',
  'Massif du Volcan': 'volcan',
  'Plaine des Cafres': 'plaine-des-cafres',
  'Plaine des Palmistes': 'plaine-des-palmistes',
  'Foret de Bebour-Belouve': 'bebour-belouve',
  'Cote Ouest': 'cote-ouest',
  'Cote Est': 'cote-est',
  'Nord': 'nord',
  'Grand Sud Sauvage': 'sud-sauvage',
  'Hauts du Nord-Est': 'hauts-nord-est',
  'Grand Benare': 'grand-benare',
  'Riviere des Remparts': 'riviere-remparts',
};
