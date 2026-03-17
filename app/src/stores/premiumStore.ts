import { create } from 'zustand';

interface PremiumState {
  isPremium: boolean;
  premiumUntil: string | null;
  // For beta/testing: everything unlocked
  isBetaMode: boolean;

  setPremium: (isPremium: boolean, until?: string) => void;
  setBetaMode: (enabled: boolean) => void;
  canUseFeature: (feature: PremiumFeature) => boolean;
}

export type PremiumFeature =
  | 'unlimited_offline_maps'
  | 'unlimited_sorties'
  | 'advanced_stats'
  | 'export_gpx'
  | 'unlimited_history';

const FREE_LIMITS = {
  offline_maps: 3,
  active_sorties: 1,
  history_count: 10,
};

export const usePremiumStore = create<PremiumState>((set, get) => ({
  isPremium: false,
  premiumUntil: null,
  isBetaMode: true, // TRUE par defaut pendant les tests — tout est accessible

  setPremium: (isPremium, until) => {
    set({ isPremium, premiumUntil: until ?? null });
  },

  setBetaMode: (enabled) => {
    set({ isBetaMode: enabled });
  },

  canUseFeature: (feature) => {
    const { isPremium, isBetaMode } = get();
    // En beta mode, tout est accessible
    if (isBetaMode) return true;
    // En premium, tout est accessible
    if (isPremium) return true;
    // En gratuit, seules certaines features sont limitees
    return false;
  },
}));

export { FREE_LIMITS };
