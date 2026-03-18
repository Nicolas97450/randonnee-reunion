import { useQuery } from '@tanstack/react-query';
import type { TrailStatus } from '@/types';

interface TrailStatusResult {
  status: TrailStatus;
  message: string | null;
  source: string;
  fetched_at: string;
}

function parseStatusFromHtml(html: string): TrailStatusResult {
  const lower = html.toLowerCase();

  let status: TrailStatus = 'inconnu';
  let message: string | null = null;

  // Cherche les indicateurs dans le HTML de l'ONF
  if (lower.includes('ouvert') || lower.includes('praticable') || lower.includes('open')) {
    status = 'ouvert';
    message = 'Sentier ouvert et praticable';
  } else if (
    lower.includes('fermé') ||
    lower.includes('ferme') ||
    lower.includes('interdit') ||
    lower.includes('closed') ||
    lower.includes('impraticable')
  ) {
    status = 'ferme';
    // Essaie d'extraire la raison
    const reasonMatch = html.match(/ferm[ée].*?[.:]\s*(.+?)(?:<|$)/i);
    message = reasonMatch
      ? reasonMatch[1].trim().substring(0, 200)
      : 'Sentier ferme par arrete prefectoral';
  } else if (
    lower.includes('dégradé') ||
    lower.includes('degrade') ||
    lower.includes('prudence') ||
    lower.includes('vigilance')
  ) {
    status = 'degrade';
    message = 'Sentier praticable avec prudence';
  }

  return {
    status,
    message,
    source: 'ONF Reunion',
    fetched_at: new Date().toISOString(),
  };
}

async function fetchTrailStatus(trailName: string): Promise<TrailStatusResult> {
  try {
    // Essaie de chercher le statut sur le site de l'ONF
    const searchTerm = encodeURIComponent(trailName.substring(0, 50));
    const url = `https://www.onf.fr/vivre-la-foret/+/b90::randonnee-la-reunion-connaitre-les-sentiers-fermes.html`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RandonneeReunion/1.0',
      },
    });

    if (!response.ok) {
      // Fallback: statut par defaut base sur la saison
      return getDefaultStatus();
    }

    const html = await response.text();

    // Cherche si le sentier est mentionne dans la page des fermetures
    const trailNameLower = trailName.toLowerCase();
    const trailWords = trailNameLower.split(/[\s\-—]+/).filter((w) => w.length > 4);

    // Require at least 2 trail name words found near closure keywords to flag as closed
    const htmlLower = html.toLowerCase();
    const closureKeywords = ['fermé', 'ferme', 'interdit', 'impraticable'];
    let matchCount = 0;

    for (const word of trailWords) {
      if (!htmlLower.includes(word)) continue;

      // Check all occurrences of this word in the HTML
      let searchFrom = 0;
      let foundNearClosure = false;
      while (searchFrom < htmlLower.length) {
        const index = htmlLower.indexOf(word, searchFrom);
        if (index === -1) break;
        searchFrom = index + word.length;

        const contextStart = Math.max(0, index - 150);
        const contextEnd = Math.min(htmlLower.length, index + word.length + 150);
        const context = htmlLower.substring(contextStart, contextEnd);

        if (closureKeywords.some((kw) => context.includes(kw))) {
          foundNearClosure = true;
          break;
        }
      }

      if (foundNearClosure) {
        matchCount++;
      }
    }

    // Only flag as closed if at least 2 significant words match near closure keywords
    if (matchCount >= 2) {
      return {
        status: 'ferme',
        message: 'Sentier signale comme ferme sur le site de l\'ONF',
        source: 'ONF Reunion',
        fetched_at: new Date().toISOString(),
      };
    }

    // If only 1 word matched or none, default to unknown — safer than a false positive
    if (matchCount === 1) {
      return {
        status: 'inconnu',
        message: 'Correspondance partielle — verifiez sur onf.fr avant de partir',
        source: 'ONF Reunion',
        fetched_at: new Date().toISOString(),
      };
    }

    // No match at all — probably open but we can't be sure
    return {
      status: 'ouvert',
      message: 'Aucune fermeture signalee par l\'ONF',
      source: 'ONF Reunion',
      fetched_at: new Date().toISOString(),
    };
  } catch {
    // En cas d'erreur reseau, retourne un statut par defaut
    return getDefaultStatus();
  }
}

function getDefaultStatus(): TrailStatusResult {
  return {
    status: 'inconnu',
    message: 'Statut non disponible — verifiez sur onf.fr avant de partir',
    source: 'cache',
    fetched_at: new Date().toISOString(),
  };
}

export function useTrailStatus(trailName: string) {
  return useQuery({
    queryKey: ['trail-status', trailName],
    queryFn: () => fetchTrailStatus(trailName),
    staleTime: 60 * 60 * 1000, // Cache 1 heure
    gcTime: 2 * 60 * 60 * 1000, // Garde en memoire 2h
    retry: 1,
  });
}
