export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatElevation(meters: number): string {
  return `${meters}m D+`;
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    facile: 'Facile',
    moyen: 'Moyen',
    difficile: 'Difficile',
    expert: 'Expert',
  };
  return labels[difficulty] ?? difficulty;
}

// [G4] Username validation for profile creation
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'system', 'support',
  'help', 'root', 'bot', 'official', 'randonnee', 'reunion',
  'randonneur', 'null', 'undefined', 'test',
];

export function sanitizeUsername(raw: string): string {
  // Remove special characters, keep letters, numbers, underscores, hyphens
  let cleaned = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 20);

  // Enforce minimum length
  if (cleaned.length < 3) {
    cleaned = `randonneur_${Date.now().toString(36).slice(-4)}`;
  }

  // Check reserved words
  if (RESERVED_USERNAMES.includes(cleaned)) {
    cleaned = `${cleaned}_${Date.now().toString(36).slice(-3)}`;
  }

  return cleaned;
}
