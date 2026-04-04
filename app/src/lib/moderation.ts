// ─── [D4] Basic content moderation — keyword filter ───────────────────────
// Filters common French insults and hate speech. Not infallible — to be
// improved with ML-based moderation in the future.

const BLOCKED_WORDS = [
  // French insults / slurs (non-exhaustive, common ones)
  'connard', 'connasse', 'enculé', 'encule', 'salaud', 'salope',
  'putain', 'pute', 'merde', 'bordel', 'batard', 'bâtard',
  'nique', 'ntm', 'fdp', 'pd', 'tg', 'ta gueule', 'ferme ta gueule',
  // Hate speech
  'nazi', 'raciste', 'negre', 'nègre', 'bougnoule', 'youpin',
  // Violence
  'je vais te tuer', 'creve', 'suicide-toi',
];

// Build regex pattern once at module load
const pattern = new RegExp(
  BLOCKED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
);

/**
 * Returns true if the content contains blocked words.
 */
export function containsBlockedContent(text: string): boolean {
  return pattern.test(text);
}

/**
 * Checks content and returns an error message if inappropriate, or null if OK.
 */
export function moderateContent(text: string): string | null {
  if (containsBlockedContent(text)) {
    return 'Ce message contient du contenu inapproprie. Merci de rester respectueux.';
  }
  return null;
}
