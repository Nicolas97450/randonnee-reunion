import { useQuery } from '@tanstack/react-query';

interface CycloneAlert {
  level: number;
  color: string;
  message: string;
}

const VIGILANCE_COLORS: Record<number, { color: string; label: string }> = {
  1: { color: '#22c55e', label: 'Vert' },
  2: { color: '#f59e0b', label: 'Jaune' },
  3: { color: '#f97316', label: 'Orange' },
  4: { color: '#dc2626', label: 'Rouge' },
};

async function fetchCycloneAlert(): Promise<CycloneAlert | null> {
  try {
    const response = await fetch(
      'https://vigilance.meteofrance.fr/data/vigilance.json',
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) return null;

    const json = await response.json();

    // Meteo-France vigilance JSON: search for dept 974 (La Reunion)
    // The structure may vary; try common paths
    const risks = json?.product?.periods ?? json?.periods ?? [];

    for (const period of risks) {
      const timelaps = period?.timelaps ?? [];
      for (const entry of timelaps) {
        const domainIds = entry?.domain_ids ?? entry?.departement_ids ?? [];
        const domainId = entry?.domain_id ?? entry?.departement ?? '';

        const isReunion =
          domainId === '974' ||
          domainId === 974 ||
          domainIds.includes('974') ||
          domainIds.includes(974);

        if (!isReunion) continue;

        const maxLevel =
          entry?.max_color_id ?? entry?.color_max ?? entry?.niveau ?? 0;
        const level = typeof maxLevel === 'number' ? maxLevel : parseInt(String(maxLevel), 10) || 0;

        // Only alert if >= orange (level 3)
        if (level >= 3) {
          const config = VIGILANCE_COLORS[level] ?? VIGILANCE_COLORS[4];
          const phenomenons = entry?.phenomenons_items ?? entry?.risk_name ?? [];
          const riskNames = Array.isArray(phenomenons)
            ? phenomenons
                .map((p: { phenomenon_id?: string; phenomenon_label?: string; libelle?: string }) =>
                  p?.phenomenon_label ?? p?.libelle ?? '',
                )
                .filter(Boolean)
                .join(', ')
            : String(phenomenons);

          return {
            level,
            color: config.color,
            message:
              riskNames ||
              `Vigilance ${config.label} pour La Reunion`,
          };
        }
      }
    }

    // Fallback: search in a flat "departements" array
    const departements = json?.departements ?? json?.meta?.departements ?? [];
    for (const dept of departements) {
      const code = dept?.code ?? dept?.departement ?? dept?.id ?? '';
      if (String(code) !== '974') continue;

      const level = dept?.niveau ?? dept?.max_color_id ?? dept?.color_max ?? 0;
      const numLevel = typeof level === 'number' ? level : parseInt(String(level), 10) || 0;

      if (numLevel >= 3) {
        const config = VIGILANCE_COLORS[numLevel] ?? VIGILANCE_COLORS[4];
        return {
          level: numLevel,
          color: config.color,
          message: dept?.message ?? `Vigilance ${config.label} pour La Reunion`,
        };
      }
    }

    return null;
  } catch {
    // Network error or parse error — do not block the app
    return null;
  }
}

export function useCycloneAlert() {
  return useQuery<CycloneAlert | null>({
    queryKey: ['cyclone-alert-974'],
    queryFn: fetchCycloneAlert,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000, // poll every hour
    retry: 1,
  });
}

export type { CycloneAlert };
