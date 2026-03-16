import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { DayForecast } from '@/hooks/useWeather';

const WEATHER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  sunny: 'sunny',
  'partly-cloudy': 'partly-sunny',
  cloudy: 'cloudy',
  rainy: 'rainy',
  stormy: 'thunderstorm',
};

const WEATHER_COLORS: Record<string, string> = {
  sunny: '#F59E0B',
  'partly-cloudy': '#93C5FD',
  cloudy: '#9CA3AF',
  rainy: '#3B82F6',
  stormy: '#8B5CF6',
};

interface Props {
  forecasts: DayForecast[];
  isLoading?: boolean;
}

export default function WeatherWidget({ forecasts, isLoading }: Props) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeleton} />
        <View style={styles.skeleton} />
        <View style={styles.skeleton} />
      </View>
    );
  }

  if (forecasts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Meteo indisponible</Text>
      </View>
    );
  }

  const labels = ['Aujourd\'hui', 'Demain', 'Apres-demain'];

  return (
    <View style={styles.container}>
      {forecasts.slice(0, 3).map((day, i) => (
        <View key={day.date} style={styles.dayCard}>
          <Text style={styles.dayLabel}>{labels[i] ?? day.date}</Text>
          <Ionicons
            name={WEATHER_ICONS[day.icon] ?? 'cloudy'}
            size={28}
            color={WEATHER_COLORS[day.icon] ?? COLORS.textSecondary}
          />
          <Text style={styles.temp}>
            {day.temp_min}° / {day.temp_max}°
          </Text>
          <Text style={styles.description}>{day.description}</Text>
          {day.precipitation_mm > 0 && (
            <View style={styles.rainRow}>
              <Ionicons name="water" size={12} color="#3B82F6" />
              <Text style={styles.rainText}>{day.precipitation_mm}mm</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  dayCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  temp: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  rainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rainText: {
    fontSize: FONT_SIZE.xs,
    color: '#3B82F6',
  },
  skeleton: {
    flex: 1,
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    flex: 1,
  },
});
