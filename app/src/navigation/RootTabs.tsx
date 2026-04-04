import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootTabParamList } from './types';
import HomeScreen from '@/screens/HomeScreen';
import MapScreen from '@/screens/MapScreen';
import TrailStack from './TrailStack';
import SocialStack from './SocialStack';
import SortiesStack from './SortiesStack';
import ProfileStack from './ProfileStack';
import { COLORS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests } from '@/hooks/useFriends';

const Tab = createBottomTabNavigator<RootTabParamList>();

function usePendingRequestCount(): number {
  const { user } = useAuth();
  const { data: requests = [] } = useFriendRequests(user?.id);
  return requests.length;
}

export default function RootTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 4);
  const pendingCount = usePendingRequestCount();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: bottomPadding,
          height: 60 + bottomPadding,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
      }}
    >
      {/* [G1] HomeScreen accessible as first tab */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: 'Carte',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TrailsTab"
        component={TrailStack}
        options={{
          title: 'Sentiers',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="trail-sign" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SocialTab"
        component={SocialStack}
        options={{
          title: 'Social',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.danger, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="SortiesTab"
        component={SortiesStack}
        options={{
          title: 'Sorties',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
