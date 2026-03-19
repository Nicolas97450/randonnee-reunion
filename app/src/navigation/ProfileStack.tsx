import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileScreen from '@/screens/ProfileScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import FeedScreen from '@/screens/FeedScreen';
import FriendsScreen from '@/screens/FriendsScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import MyHikesScreen from '@/screens/MyHikesScreen';
import ChallengesScreen from '@/screens/ChallengesScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import TrailReplayScreen from '@/screens/TrailReplayScreen';
import SearchScreen from '@/screens/SearchScreen';
import { COLORS } from '@/constants';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Parametres' }}
      />
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: 'Communaute' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Mes amis' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({ title: route.params.username ?? 'Profil' })}
      />
      <Stack.Screen
        name="MyHikes"
        component={MyHikesScreen}
        options={{ title: 'Mes randonnees' }}
      />
      <Stack.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{ title: 'Mes defis' }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Classement' }}
      />
      <Stack.Screen
        name="TrailReplay"
        component={TrailReplayScreen}
        options={{ title: 'Replay', headerTransparent: true, headerTintColor: COLORS.textPrimary }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Recherche' }}
      />
    </Stack.Navigator>
  );
}
