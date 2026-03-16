import { create } from 'zustand';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  createDownloadResumable,
} from 'expo-file-system/legacy';

interface OfflineMap {
  trailSlug: string;
  filePath: string;
  sizeMb: number;
  downloadedAt: string;
}

interface DownloadProgress {
  trailSlug: string;
  progress: number; // 0 to 1
}

interface OfflineState {
  maps: OfflineMap[];
  downloads: DownloadProgress[];
  isLoaded: boolean;

  loadMaps: () => Promise<void>;
  isDownloaded: (trailSlug: string) => boolean;
  getDownloadProgress: (trailSlug: string) => number | null;
  downloadMap: (trailSlug: string, url: string, sizeMb: number) => Promise<void>;
  deleteMap: (trailSlug: string) => Promise<void>;
  getTotalSizeMb: () => number;
}

const TILES_DIR = `${documentDirectory}tiles/`;
const INDEX_FILE = `${documentDirectory}tiles-index.json`;

export const useOfflineStore = create<OfflineState>((set, get) => ({
  maps: [],
  downloads: [],
  isLoaded: false,

  loadMaps: async () => {
    try {
      const dirInfo = await getInfoAsync(TILES_DIR);
      if (!dirInfo.exists) {
        await makeDirectoryAsync(TILES_DIR, { intermediates: true });
      }

      const indexInfo = await getInfoAsync(INDEX_FILE);
      if (indexInfo.exists) {
        const content = await readAsStringAsync(INDEX_FILE);
        const maps = JSON.parse(content) as OfflineMap[];
        set({ maps, isLoaded: true });
      } else {
        set({ maps: [], isLoaded: true });
      }
    } catch {
      set({ maps: [], isLoaded: true });
    }
  },

  isDownloaded: (trailSlug) => {
    return get().maps.some((m) => m.trailSlug === trailSlug);
  },

  getDownloadProgress: (trailSlug) => {
    const dl = get().downloads.find((d) => d.trailSlug === trailSlug);
    return dl?.progress ?? null;
  },

  downloadMap: async (trailSlug, url, sizeMb) => {
    const filePath = `${TILES_DIR}${trailSlug}.pmtiles`;

    set((state) => ({
      downloads: [...state.downloads, { trailSlug, progress: 0 }],
    }));

    try {
      const downloadResumable = createDownloadResumable(
        url,
        filePath,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          set((state) => ({
            downloads: state.downloads.map((d) =>
              d.trailSlug === trailSlug ? { ...d, progress } : d,
            ),
          }));
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download failed');

      const newMap: OfflineMap = {
        trailSlug,
        filePath,
        sizeMb,
        downloadedAt: new Date().toISOString(),
      };

      const updatedMaps = [...get().maps, newMap];
      await writeAsStringAsync(INDEX_FILE, JSON.stringify(updatedMaps));

      set((state) => ({
        maps: updatedMaps,
        downloads: state.downloads.filter((d) => d.trailSlug !== trailSlug),
      }));
    } catch {
      set((state) => ({
        downloads: state.downloads.filter((d) => d.trailSlug !== trailSlug),
      }));
      throw new Error('Echec du telechargement de la carte');
    }
  },

  deleteMap: async (trailSlug) => {
    const map = get().maps.find((m) => m.trailSlug === trailSlug);
    if (map) {
      try {
        await deleteAsync(map.filePath, { idempotent: true });
      } catch {
        // File might already be gone
      }

      const updatedMaps = get().maps.filter((m) => m.trailSlug !== trailSlug);
      await writeAsStringAsync(INDEX_FILE, JSON.stringify(updatedMaps));
      set({ maps: updatedMaps });
    }
  },

  getTotalSizeMb: () => {
    return get().maps.reduce((total, m) => total + m.sizeMb, 0);
  },
}));
