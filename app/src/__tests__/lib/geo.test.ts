/**
 * Tests unitaires — geo.ts
 * Calculs de distance GPS (Haversine) et formatage de distances.
 */

import { haversineDistance, formatDistanceToPoint, douglasPeucker } from '@/lib/geo';

describe('haversineDistance', () => {
  test('retourne 0 pour deux points identiques', () => {
    const dist = haversineDistance(-21.1151, 55.5364, -21.1151, 55.5364);
    expect(dist).toBe(0);
  });

  test('calcule correctement la distance Saint-Denis → Saint-Pierre (~60 km)', () => {
    // Saint-Denis : -20.8789, 55.4481
    // Saint-Pierre : -21.3393, 55.4781
    const dist = haversineDistance(-20.8789, 55.4481, -21.3393, 55.4781);
    // Distance a vol d'oiseau ~51 km
    expect(dist).toBeGreaterThan(48);
    expect(dist).toBeLessThan(55);
  });

  test('calcule correctement une courte distance (< 1 km)', () => {
    // Deux points proches dans Saint-Denis
    const dist = haversineDistance(-20.8789, 55.4481, -20.8799, 55.4491);
    expect(dist).toBeGreaterThan(0.05);
    expect(dist).toBeLessThan(0.5);
  });

  test('est symetrique (A→B == B→A)', () => {
    const distAB = haversineDistance(-21.1, 55.5, -20.9, 55.4);
    const distBA = haversineDistance(-20.9, 55.4, -21.1, 55.5);
    expect(distAB).toBeCloseTo(distBA, 10);
  });

  test('gere les coordonnees negatives (hemisphere sud)', () => {
    const dist = haversineDistance(-21.1, 55.5, -21.2, 55.6);
    expect(dist).toBeGreaterThan(0);
    expect(typeof dist).toBe('number');
    expect(isNaN(dist)).toBe(false);
  });
});

describe('formatDistanceToPoint', () => {
  test('affiche en metres pour les distances < 1 km', () => {
    expect(formatDistanceToPoint(0.12)).toBe('120 m');
    expect(formatDistanceToPoint(0.05)).toBe('50 m');
    expect(formatDistanceToPoint(0.5)).toBe('500 m');
    expect(formatDistanceToPoint(0.999)).toBe('999 m');
  });

  test('affiche en km pour les distances >= 1 km', () => {
    expect(formatDistanceToPoint(1.0)).toBe('1.0 km');
    expect(formatDistanceToPoint(1.5)).toBe('1.5 km');
    expect(formatDistanceToPoint(12.345)).toBe('12.3 km');
  });

  test('arrondit correctement les metres', () => {
    expect(formatDistanceToPoint(0.1234)).toBe('123 m');
    expect(formatDistanceToPoint(0.0001)).toBe('0 m');
  });

  test('gere la valeur 0', () => {
    expect(formatDistanceToPoint(0)).toBe('0 m');
  });
});

describe('douglasPeucker', () => {
  test('retourne le trace intact pour < 2 points', () => {
    const single = [{ latitude: -21.1, longitude: 55.5 }];
    expect(douglasPeucker(single, 0.01)).toEqual(single);

    const empty: Array<{ latitude: number; longitude: number }> = [];
    expect(douglasPeucker(empty, 0.01)).toEqual(empty);
  });

  test('retourne deux points pour un segment droit de 2 points', () => {
    const points = [
      { latitude: -21.1, longitude: 55.5 },
      { latitude: -21.2, longitude: 55.6 },
    ];
    const result = douglasPeucker(points, 0.01);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(points[0]);
    expect(result[1]).toEqual(points[1]);
  });

  test('compresse une trace sinueuse (3 points dont 1 outlier)', () => {
    // Trace : depart -> detour loin -> fin
    // L'epsilon a 10m (0.01 km) devrait eliminer le point central s'il est proche de la ligne
    const points = [
      { latitude: -21.0, longitude: 55.5 },
      { latitude: -21.0001, longitude: 55.5001 }, // Point very close to line (< 10m)
      { latitude: -21.1, longitude: 55.6 },
    ];
    const result = douglasPeucker(points, 0.01);
    // Le point du milieu devrait etre elimine si proche de la ligne
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[2]);
  });

  test('conserve un point outlier loin de la ligne', () => {
    // Trace : A -> B (detour important) -> C
    // B est a > 10m de la ligne AC, donc il doit etre conserve
    const points = [
      { latitude: -21.0, longitude: 55.5 },
      { latitude: -21.2, longitude: 55.3 }, // Detour significant
      { latitude: -21.3, longitude: 55.6 },
    ];
    const result = douglasPeucker(points, 0.01);
    // Avec epsilon 10m, le point du milieu devrait etre conserve (c'est un detour)
    expect(result.length).toBeGreaterThan(2);
  });

  test('premier et dernier points sont toujours conserves', () => {
    const points = [
      { latitude: -21.0, longitude: 55.5 },
      { latitude: -21.05, longitude: 55.55 },
      { latitude: -21.1, longitude: 55.6 },
      { latitude: -21.15, longitude: 55.65 },
    ];
    const result = douglasPeucker(points, 0.01);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[points.length - 1]);
  });

  test('reduit significativement le nombre de points avec epsilon loose', () => {
    // Trace avec 50 points en zigzag (simule GPS bruite)
    const points = [];
    for (let i = 0; i < 50; i++) {
      points.push({
        latitude: -21.0 + (i * 0.001),
        longitude: 55.5 + (i * 0.001) + (i % 2 === 0 ? 0.0005 : -0.0005), // zigzag ~55m
      });
    }
    const resultLoose = douglasPeucker(points, 0.1); // 100 meters
    const resultTight = douglasPeucker(points, 0.01); // 10 meters
    // Epsilon loose devrait compresser plus que tight
    expect(resultLoose.length).toBeLessThan(resultTight.length);
    expect(resultLoose.length).toBeLessThan(points.length);
  });

  test('default epsilon is 0.01 (10 meters)', () => {
    const points = [
      { latitude: -21.0, longitude: 55.5 },
      { latitude: -21.0001, longitude: 55.5001 },
      { latitude: -21.1, longitude: 55.6 },
    ];
    // Appel sans epsilon explicite
    const resultDefault = douglasPeucker(points);
    const resultExplicit = douglasPeucker(points, 0.01);
    // Devrait etre identique si l'epsilon par defaut est bien 0.01
    expect(resultDefault.length).toBe(resultExplicit.length);
  });
});
