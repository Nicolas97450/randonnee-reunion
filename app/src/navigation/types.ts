import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TrailStackParamList = {
  TrailList: undefined;
  TrailDetail: { trailId: string };
};

export type RootTabParamList = {
  MapTab: undefined;
  TrailsTab: NavigatorScreenParams<TrailStackParamList>;
  ProfileTab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
