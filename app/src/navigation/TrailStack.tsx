import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TrailStackParamList } from './types';
import TrailListScreen from '@/screens/TrailListScreen';
import TrailDetailScreen from '@/screens/TrailDetailScreen';
import NavigationScreen from '@/screens/NavigationScreen';
import CreateSortieScreen from '@/screens/CreateSortieScreen';
import SortieDetailScreen from '@/screens/SortieDetailScreen';
import HikeSummaryScreen from '@/screens/HikeSummaryScreen';
import { COLORS } from '@/constants';

const Stack = createNativeStackNavigator<TrailStackParamList>();

export default function TrailStack() {
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
        name="TrailList"
        component={TrailListScreen}
        options={{ title: 'Sentiers' }}
      />
      <Stack.Screen
        name="TrailDetail"
        component={TrailDetailScreen}
        options={({ route }) => ({ title: route.params?.trailName ?? 'Fiche sentier' })}
      />
      <Stack.Screen
        name="Navigation"
        component={NavigationScreen}
        options={{
          title: 'Navigation GPS',
          headerTransparent: true,
          headerTintColor: COLORS.textPrimary,
        }}
      />
      <Stack.Screen
        name="CreateSortie"
        component={CreateSortieScreen}
        options={{ title: 'Organiser une sortie' }}
      />
      <Stack.Screen
        name="SortieDetail"
        component={SortieDetailScreen}
        options={{ title: 'Sortie' }}
      />
      <Stack.Screen
        name="HikeSummary"
        component={HikeSummaryScreen}
        options={{ title: 'Bravo !', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
