/**
 * Tests unitaires — formatters.ts
 * Formatage des durees, distances, elevations, difficulte, et sanitization username.
 */

import {
  formatDuration,
  formatDistance,
  formatElevation,
  getDifficultyLabel,
  sanitizeUsername,
} from '@/lib/formatters';

describe('formatDuration', () => {
  test('affiche uniquement les minutes quand < 1h', () => {
    expect(formatDuration(30)).toBe('30min');
    expect(formatDuration(1)).toBe('1min');
    expect(formatDuration(59)).toBe('59min');
  });

  test('affiche uniquement les heures quand minutes = 0', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(300)).toBe('5h');
  });

  test('affiche heures et minutes combines', () => {
    expect(formatDuration(90)).toBe('1h30');
    expect(formatDuration(65)).toBe('1h05');
    expect(formatDuration(125)).toBe('2h05');
    expect(formatDuration(150)).toBe('2h30');
  });

  test('gere 0 minutes', () => {
    expect(formatDuration(0)).toBe('0min');
  });
});

describe('formatDistance', () => {
  test('formate avec 1 decimale', () => {
    expect(formatDistance(5.0)).toBe('5.0 km');
    expect(formatDistance(12.345)).toBe('12.3 km');
    expect(formatDistance(0.5)).toBe('0.5 km');
  });
});

describe('formatElevation', () => {
  test('formate avec suffixe D+', () => {
    expect(formatElevation(500)).toBe('500m D+');
    expect(formatElevation(1200)).toBe('1200m D+');
    expect(formatElevation(0)).toBe('0m D+');
  });
});

describe('getDifficultyLabel', () => {
  test('retourne le label correct pour chaque difficulte', () => {
    expect(getDifficultyLabel('facile')).toBe('Facile');
    expect(getDifficultyLabel('moyen')).toBe('Moyen');
    expect(getDifficultyLabel('difficile')).toBe('Difficile');
    expect(getDifficultyLabel('expert')).toBe('Expert');
  });

  test('retourne la valeur brute si inconnue', () => {
    expect(getDifficultyLabel('inconnu')).toBe('inconnu');
    expect(getDifficultyLabel('')).toBe('');
  });
});

describe('sanitizeUsername', () => {
  test('nettoie les caracteres speciaux', () => {
    const result = sanitizeUsername('Hello World!@#');
    expect(result).toBe('helloworld');
  });

  test('supprime les accents', () => {
    const result = sanitizeUsername('Réunion Île');
    expect(result).toBe('reunionile');
  });

  test('conserve underscores et tirets', () => {
    const result = sanitizeUsername('user_name-123');
    expect(result).toBe('user_name-123');
  });

  test('tronque a 20 caracteres maximum', () => {
    const result = sanitizeUsername('a'.repeat(30));
    expect(result.length).toBeLessThanOrEqual(20);
  });

  test('genere un username si trop court (< 3 caracteres)', () => {
    const result = sanitizeUsername('ab');
    expect(result).toMatch(/^randonneur_/);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  test('ajoute un suffixe aux mots reserves', () => {
    const result = sanitizeUsername('admin');
    expect(result).not.toBe('admin');
    expect(result).toMatch(/^admin_/);
  });

  test('bloque les mots reserves connus', () => {
    const reserved = ['admin', 'moderator', 'system', 'root', 'bot', 'test'];
    for (const word of reserved) {
      const result = sanitizeUsername(word);
      expect(result).not.toBe(word);
    }
  });

  test('passe en minuscules', () => {
    const result = sanitizeUsername('MonUsername');
    expect(result).toBe('monusername');
  });
});
