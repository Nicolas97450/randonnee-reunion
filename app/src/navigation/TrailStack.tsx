import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TrailStackParamList } from './types';
import TrailListScreen from '@/screens/TrailListScreen';
import TrailDetailScreen from '@/screens/TrailDetailScreen';
import NavigationScreen from '@/screens/NavigationScreen';
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
        options={{ title: 'Fiche sentier' }}
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
    </Stack.Navigator>
  );
}
