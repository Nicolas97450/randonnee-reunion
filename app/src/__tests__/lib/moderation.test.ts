/**
 * Unit tests for moderation.ts
 * Tests content filtering for blocked words and inappropriate content
 */

import { containsBlockedContent, moderateContent } from '../../lib/moderation';

describe('moderation.ts', () => {
  describe('containsBlockedContent', () => {
    // --- Normal cases: should detect blocked words ---

    it('should detect common French insults', () => {
      expect(containsBlockedContent('connard')).toBe(true);
      expect(containsBlockedContent('salaud')).toBe(true);
      expect(containsBlockedContent('putain')).toBe(true);
      expect(containsBlockedContent('merde')).toBe(true);
    });

    it('should detect insults case insensitively', () => {
      expect(containsBlockedContent('CONNARD')).toBe(true);
      expect(containsBlockedContent('Salaud')).toBe(true);
      expect(containsBlockedContent('PUTAIN')).toBe(true);
      expect(containsBlockedContent('MeRdE')).toBe(true);
    });

    it('should detect blocked words within sentences', () => {
      expect(containsBlockedContent('Tu es un connard')).toBe(true);
      expect(containsBlockedContent('Quel salaud!')).toBe(true);
      expect(containsBlockedContent('C\'est merde')).toBe(true);
      expect(containsBlockedContent('Pourquoi tu es salope')).toBe(true);
    });

    it('should detect hate speech words', () => {
      expect(containsBlockedContent('nazi')).toBe(true);
      expect(containsBlockedContent('raciste')).toBe(true);
      expect(containsBlockedContent('youpin')).toBe(true);
      expect(containsBlockedContent('bougnoule')).toBe(true);
    });

    it('should detect hate speech case insensitively', () => {
      expect(containsBlockedContent('NAZI')).toBe(true);
      expect(containsBlockedContent('Raciste')).toBe(true);
      expect(containsBlockedContent('YOUPIN')).toBe(true);
    });

    it('should detect violence-related blocked words', () => {
      expect(containsBlockedContent('je vais te tuer')).toBe(true);
      expect(containsBlockedContent('creve')).toBe(true);
      expect(containsBlockedContent('suicide-toi')).toBe(true);
    });

    it('should detect shortcuts and acronyms', () => {
      expect(containsBlockedContent('ntm')).toBe(true);
      expect(containsBlockedContent('fdp')).toBe(true);
      expect(containsBlockedContent('pd')).toBe(true);
      expect(containsBlockedContent('tg')).toBe(true);
    });

    it('should detect longer phrases like ta gueule', () => {
      expect(containsBlockedContent('ta gueule')).toBe(true);
      expect(containsBlockedContent('ferme ta gueule')).toBe(true);
    });

    // --- Edge cases: partial words, accents ---

    it('should detect words with accents (accented variants)', () => {
      expect(containsBlockedContent('nègre')).toBe(true);
      expect(containsBlockedContent('bâtard')).toBe(true);
    });

    it('should detect words even with extra punctuation', () => {
      expect(containsBlockedContent('salaud!')).toBe(true);
      expect(containsBlockedContent('connard?')).toBe(true);
      expect(containsBlockedContent('merde...')).toBe(true);
      expect(containsBlockedContent('(putain)')).toBe(true);
    });

    // --- Clean text cases: should return false ---

    it('should return false for clean text', () => {
      expect(containsBlockedContent('Bonjour tout le monde')).toBe(false);
      expect(containsBlockedContent('C\'est une belle rando')).toBe(false);
      expect(containsBlockedContent('Merci pour les informations')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(containsBlockedContent('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(containsBlockedContent('   ')).toBe(false);
      expect(containsBlockedContent('\n\t')).toBe(false);
    });

    it('should return false for numbers and special characters only', () => {
      expect(containsBlockedContent('12345')).toBe(false);
      expect(containsBlockedContent('@#$%^')).toBe(false);
    });

    it('should return false for similar but not blocked words', () => {
      expect(containsBlockedContent('con')).toBe(false); // "con" is not the same as "connard"
      expect(containsBlockedContent('put')).toBe(false); // Partial word
      expect(containsBlockedContent('salt')).toBe(false); // Starts with "sal" but isn't "salaud"
    });

    it('should return false for words that contain blocked words as substrings', () => {
      // These should pass as they don't exactly match the blocked patterns
      expect(containsBlockedContent('concentration')).toBe(false);
      expect(containsBlockedContent('reputation')).toBe(false);
    });
  });

  describe('moderateContent', () => {
    it('should return null for clean text', () => {
      expect(moderateContent('Bonjour')).toBeNull();
      expect(moderateContent('Quelle belle randonnee')).toBeNull();
      expect(moderateContent('Merci beaucoup')).toBeNull();
    });

    it('should return error message for blocked content', () => {
      const result = moderateContent('connard');
      expect(result).toBe('Ce message contient du contenu inapproprie. Merci de rester respectueux.');
    });

    it('should return same error message regardless of blocked word', () => {
      const result1 = moderateContent('salaud');
      const result2 = moderateContent('putain');
      const result3 = moderateContent('nazi');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should detect blocked content within longer text and return error', () => {
      const result = moderateContent('Tu es vraiment connard pour avoir dit ca');
      expect(result).not.toBeNull();
      expect(result).toBe('Ce message contient du contenu inapproprie. Merci de rester respectueux.');
    });

    it('should work case insensitively and return error', () => {
      const result = moderateContent('CONNARD');
      expect(result).not.toBeNull();
    });

    it('should return null for empty string', () => {
      expect(moderateContent('')).toBeNull();
    });

    it('should return null for whitespace', () => {
      expect(moderateContent('   ')).toBeNull();
      expect(moderateContent('\n')).toBeNull();
    });

    it('should return null for numbers and special chars', () => {
      expect(moderateContent('12345')).toBeNull();
      expect(moderateContent('!@#$%')).toBeNull();
    });
  });
});
