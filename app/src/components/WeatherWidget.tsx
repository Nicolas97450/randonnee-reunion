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
  sunny: COLORS.warm,
  'partly-cloudy': COLORS.info,
  cloudy: COLORS.statusUnknown,
  rainy: COLORS.info,
  stormy: COLORS.expert,
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
              <Ionicons name="water" size={12} color={COLORS.info} />
              <Text style={styles.rainText}>{day.precipitation_mm}mm</Text>
            </View>
          )}

          {/* Alertes montagne */}
          {day.uv_index_max > 8 && (
            <View style={[styles.alertBadge, { backgroundColor: COLORS.warning + '30' }]}>
              <Text style={[styles.alertText, { color: COLORS.warning }]}>UV eleve</Text>
            </View>
          )}
          {day.wind_gusts_kmh > 60 && (
            <View style={[styles.alertBadge, { backgroundColor: COLORS.danger + '30' }]}>
              <Text style={[styles.alertText, { color: COLORS.danger }]}>Vent fort</Text>
            </View>
          )}
          {day.visibility_m < 1000 && (
            <View style={[styles.alertBadge, { backgroundColor: COLORS.statusUnknown + '30' }]}>
              <Text style={[styles.alertText, { color: COLORS.statusUnknown }]}>Brouillard</Text>
            </View>
          )}

          {/* Lever / coucher du soleil */}
          {day.sunrise && day.sunset && (
            <View style={styles.sunRow}>
              <Ionicons name="sunny-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.sunText}>
                {formatSunTime(day.sunrise)} - {formatSunTime(day.sunset)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function formatSunTime(isoTime: string): string {
  // Open-Meteo returns "2026-03-19T06:15" format
  const parts = isoTime.split('T');
  if (parts.length < 2) return isoTime;
  const [hours, minutes] = parts[1].split(':');
  return `${parseInt(hours, 10)}h${minutes}`;
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
    gap: SPACING.xs,
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
    color: COLORS.info,
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
  alertBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  alertText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: '700',
    textAlign: 'center',
  },
  sunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sunText: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textMuted,
  },
});
