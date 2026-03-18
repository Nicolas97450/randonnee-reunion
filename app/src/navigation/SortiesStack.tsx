import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SortiesStackParamList } from './types';
import SortiesScreen from '@/screens/SortiesScreen';
import SortieDetailScreen from '@/screens/SortieDetailScreen';
import { COLORS } from '@/constants';

const Stack = createNativeStackNavigator<SortiesStackParamList>();

export default function SortiesStack() {
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
        name="SortiesList"
        component={SortiesScreen}
        options={{ title: 'Sorties' }}
      />
      <Stack.Screen
        name="SortieDetailFromSorties"
        component={SortieDetailScreen}
        options={{ title: 'Sortie' }}
      />
    </Stack.Navigator>
  );
}
