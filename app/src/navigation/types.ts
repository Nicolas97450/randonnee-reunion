import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Sortie } from '@/types';

export interface HikeSummaryParams {
  trailId: string;
  trailName: string;
  trailSlug: string;
  distanceKm: number;
  durationMin: number;
  elevationGainM: number;
  averageSpeedKmh: number;
  traceGeoJson: string; // JSON-stringified GeoJSON LineString
  completedAt: string;
  activityId: string;
}

export interface TrailReplayParams {
  traceGeoJson: string; // JSON-stringified GeoJSON LineString
  distanceKm: number;
  durationMin: number;
  trailName: string;
}

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TrailStackParamList = {
  TrailList: undefined;
  TrailDetail: { trailId: string; trailName?: string };
  Navigation: { trailId: string };
  CreateSortie: { trailId: string; trailName: string };
  SortieDetail: { sortie: Sortie };
  HikeSummary: HikeSummaryParams;
  TrailReplay: TrailReplayParams;
};

export type SortiesStackParamList = {
  SortiesList: undefined;
  SortieDetailFromSorties: { sortie: Sortie };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Feed: undefined;
  Friends: undefined;
  UserProfile: { userId: string; username?: string };
  MyHikes: undefined;
  Challenges: undefined;
  Leaderboard: undefined;
  TrailReplay: TrailReplayParams;
  Search: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  TrailsTab: NavigatorScreenParams<TrailStackParamList>;
  SortiesTab: NavigatorScreenParams<SortiesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
