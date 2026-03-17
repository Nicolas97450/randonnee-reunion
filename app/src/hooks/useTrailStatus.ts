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
    const trailWords = trailNameLower.split(/[\s-]+/).filter((w) => w.length > 3);

    // Verifie si un des mots cles du sentier est dans la section des fermetures
    let isInClosureList = false;
    for (const word of trailWords) {
      if (html.toLowerCase().includes(word)) {
        // Verifie le contexte autour du mot
        const index = html.toLowerCase().indexOf(word);
        const context = html.substring(Math.max(0, index - 200), index + 200).toLowerCase();

        if (
          context.includes('fermé') ||
          context.includes('ferme') ||
          context.includes('interdit') ||
          context.includes('impraticable')
        ) {
          isInClosureList = true;
          break;
        }
      }
    }

    if (isInClosureList) {
      return {
        status: 'ferme',
        message: 'Sentier signale comme ferme sur le site de l\'ONF',
        source: 'ONF Reunion',
        fetched_at: new Date().toISOString(),
      };
    }

    // Si pas dans la liste des fermetures = probablement ouvert
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
