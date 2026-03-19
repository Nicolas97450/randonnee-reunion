import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@rando_favorites';

/**
 * Hook de gestion des sentiers favoris (stockage local AsyncStorage).
 * Retourne la liste des slugs favoris + helpers pour toggle/check.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les favoris au montage
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
      })
      .catch(() => {
        // Silently fail — empty favorites
      })
      .finally(() => setIsLoading(false));
  }, []);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const isFavorite = useCallback(
    (slug: string): boolean => favoritesSet.has(slug),
    [favoritesSet],
  );

  const toggleFavorite = useCallback(
    async (slug: string) => {
      setFavorites((prev) => {
        const next = prev.includes(slug)
          ? prev.filter((s) => s !== slug)
          : [...prev, slug];
        // Persist asynchronously
        AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  return { favorites, isFavorite, toggleFavorite, isLoading };
}
