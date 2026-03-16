import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TrailStackParamList = {
  TrailList: undefined;
  TrailDetail: { trailId: string };
  Navigation: { trailId: string };
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
