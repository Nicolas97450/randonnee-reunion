import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Créer le QueryClient avec des timeouts étendus pour la persistance offline
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 heures (garbage collection) — augmenté pour la persistance
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Créer le persister AsyncStorage pour la sauvegarde offline
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'rando-reunion-cache',
  throttleTime: 1000, // Écrire en AsyncStorage max une fois par seconde
});
