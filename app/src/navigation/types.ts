import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Sortie } from '@/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TrailStackParamList = {
  TrailList: undefined;
  TrailDetail: { trailId: string };
  Navigation: { trailId: string };
  CreateSortie: { trailId: string; trailName: string };
  SortieDetail: { sortie: Sortie };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

export type RootTabParamList = {
  MapTab: undefined;
  TrailsTab: NavigatorScreenParams<TrailStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
