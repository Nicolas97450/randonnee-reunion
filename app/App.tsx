import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootTabs, AuthStack } from '@/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useCycloneAlert } from '@/hooks/useCycloneAlert';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { useThemeStore, DARK_COLORS, LIGHT_COLORS } from '@/stores/themeStore';
import { navigationRef } from '@/lib/navigationRef';
import OnboardingScreen from '@/screens/OnboardingScreen';
import OfflineBanner from '@/components/OfflineBanner';
import InAppNotifications from '@/components/InAppNotifications';
import ErrorBoundary from '@/components/ErrorBoundary';

// [I1] Initialize Sentry — DSN will be set when project is created
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2, // 20% of transactions for performance
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}

function buildNavTheme(isDark: boolean) {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  return {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  };
}

function CycloneAlertBanner() {
  const { data: alert } = useCycloneAlert();
  if (!alert) return null;

  const bgColor = alert.level >= 4 ? '#dc2626' : '#f97316';

  return (
    <Pressable
      style={[styles.cycloneBanner, { backgroundColor: bgColor }]}
      onPress={() => Linking.openURL('https://vigilance.meteofrance.fr/fr/la-reunion')}
      accessibilityLabel={`Alerte cyclonique - ${alert.message}`}
    >
      <Text style={styles.cycloneBannerText}>
        Alerte cyclonique — {alert.message}
      </Text>
      <Text style={styles.cycloneBannerLink}>Voir Meteo-France</Text>
    </Pressable>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasSeenOnboarding, completeOnboarding } = useOnboarding();
  const isDark = useThemeStore((s) => s.isDark);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={[styles.loading, { backgroundColor: isDark ? DARK_COLORS.background : LIGHT_COLORS.background }]}>
        <ActivityIndicator size="large" color={DARK_COLORS.primary} />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  return <RootTabs />;
}

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.flex}>
        <ErrorBoundary>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              maxAge: 3 * 24 * 60 * 60 * 1000, // 3 jours — les données en cache expirent après 3 jours
              dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                  // Persister uniquement les requêtes réussies (pas les erreurs)
                  const state = query.state;
                  return state.status === 'success';
                },
              },
            }}
            onSuccess={() => {
              // Callback appelé après restauration du cache depuis AsyncStorage
              // Laisser vide — le cache est restauré automatiquement
            }}
          >
            <NavigationContainer ref={navigationRef} theme={buildNavTheme(isDark)}>
              <CycloneAlertBanner />
              <OfflineBanner />
              <RootNavigator />
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </NavigationContainer>
            <InAppNotifications />
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycloneBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cycloneBannerText: {
    color: '#fafaf9',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  cycloneBannerLink: {
    color: '#fafaf9',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
});
