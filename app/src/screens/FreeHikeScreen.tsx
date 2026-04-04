import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Mapbox from '@rnmapbox/maps';
import BaseMap from '@/components/BaseMap';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';
import { douglasPeucker } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { TrailStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrailStackParamList, 'FreeHike'>;

export default function FreeHikeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const {
    currentPosition, track, isTracking, error,
    startTracking, stopTracking, getTrackStats, clearTrack,
  } = useGPSTracking();
  const [isSaving, setIsSaving] = useState(false);

  const trackGeoJson = useMemo(() => {
    if (track.length < 2) return null;
    // [PERF-1] Compress trace with Douglas-Peucker for map rendering performance
    // Tolerance: 10 meters (0.01 km) for hiking trails (balances precision vs rendering speed)
    const compressedTrack = douglasPeucker(
      track.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      0.01, // 10 meters in kilometers
    );
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: compressedTrack.map((p) => [p.longitude, p.latitude]),
      },
      properties: {},
    };
  }, [track]);

  const stats = useMemo(() => getTrackStats(), [track.length, getTrackStats]);

  const formattedTime = useMemo(() => {
    const totalSec = stats.durationMin * 60;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [stats.durationMin]);

  const handleToggleTracking = useCallback(async () => {
    if (isTracking) {
      await stopTracking();
      if (track.length < 5) {
        Alert.alert('Trace trop courte', 'Marche un peu plus pour enregistrer une trace.');
        return;
      }
      // Ask to save
      Alert.alert(
        'Rando terminee',
        `${formatDistance(stats.distanceKm)} — ${formatDuration(stats.durationMin)}`,
        [
          { text: 'Supprimer', style: 'destructive', onPress: () => clearTrack() },
          {
            text: 'Sauvegarder',
            onPress: () => {
              Alert.prompt
                ? Alert.prompt('Nom de ta rando', 'Donne un nom a cette balade', (name) => saveHike(name))
                : promptAndSave();
            },
          },
        ],
      );
    } else {
      await startTracking();
    }
  }, [isTracking, track.length, stats]);

  const [showNameInput, setShowNameInput] = useState(false);
  const [hikeName, setHikeName] = useState('');

  const promptAndSave = useCallback(() => {
    setShowNameInput(true);
  }, []);

  const saveHike = useCallback(async (name?: string) => {
    if (!user?.id || track.length < 2) return;
    setIsSaving(true);
    try {
      const traceObj = {
        type: 'LineString',
        coordinates: track.map((p) => [p.longitude, p.latitude, p.altitude ?? 0]),
      };
      const finalName = name?.trim() || `Rando du ${new Date().toLocaleDateString('fr-FR')}`;

      const { data, error: insertError } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          trail_id: null,
          validation_type: 'free',
          completed_at: new Date().toISOString(),
          distance_km: Number(stats.distanceKm.toFixed(2)),
          duration_min: stats.durationMin,
          elevation_gain_m: stats.elevationGain,
          average_speed_kmh: stats.durationMin > 0
            ? Number((stats.distanceKm / (stats.durationMin / 60)).toFixed(1))
            : 0,
          trace_geojson: traceObj,
          custom_name: finalName,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      clearTrack();
      setShowNameInput(false);

      navigation.replace('HikeSummary', {
        trailId: '',
        trailName: finalName,
        trailSlug: '',
        distanceKm: Number(stats.distanceKm.toFixed(2)),
        durationMin: stats.durationMin,
        elevationGainM: stats.elevationGain,
        averageSpeedKmh: stats.durationMin > 0
          ? Number((stats.distanceKm / (stats.durationMin / 60)).toFixed(1))
          : 0,
        traceGeoJson: JSON.stringify(traceObj),
        completedAt: new Date().toISOString(),
        activityId: data?.id ?? '',
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la rando.');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, track, stats, navigation, clearTrack]);

  return (
    <View style={styles.container}>
      {/* Map */}
      <BaseMap
        centerCoordinate={
          currentPosition
            ? [currentPosition.longitude, currentPosition.latitude]
            : undefined
        }
        zoomLevel={15}
        followUserLocation={isTracking}
      >
        {trackGeoJson && (
          <Mapbox.ShapeSource id="free-track" shape={trackGeoJson}>
            <Mapbox.LineLayer
              id="free-track-line"
              style={{
                lineColor: COLORS.success,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </BaseMap>

      {/* Stats HUD */}
      <View style={styles.statsHud}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDistance(stats.distanceKm)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formattedTime}</Text>
          <Text style={styles.statLabel}>Duree</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatElevation(stats.elevationGain)}</Text>
          <Text style={styles.statLabel}>D+</Text>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Name input modal */}
      {showNameInput && (
        <View style={styles.nameOverlay}>
          <View style={styles.nameCard}>
            <Text style={styles.nameTitle}>Nom de ta rando</Text>
            <View style={styles.nameInputRow}>
              <Ionicons name="pencil" size={18} color={COLORS.textMuted} />
              <View style={styles.nameInputWrapper}>
                <Text
                  style={styles.nameInput}
                  onPress={() => {
                    Alert.prompt
                      ? Alert.prompt('Nom', '', (val) => { setHikeName(val); })
                      : setHikeName(`Rando du ${new Date().toLocaleDateString('fr-FR')}`);
                  }}
                >
                  {hikeName || 'Appuie pour nommer...'}
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
              onPress={() => saveHike(hikeName)}
              disabled={isSaving}
              accessibilityLabel="Sauvegarder la rando"
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>

        <Pressable
          style={[styles.mainButton, isTracking && styles.mainButtonStop]}
          onPress={handleToggleTracking}
          accessibilityLabel={isTracking ? 'Arreter la rando' : 'Demarrer la rando'}
        >
          <Ionicons
            name={isTracking ? 'stop' : 'play'}
            size={28}
            color={COLORS.white}
          />
          <Text style={styles.mainButtonText}>
            {isTracking ? 'Arreter' : 'Demarrer'}
          </Text>
        </Pressable>

        <View style={{ width: 44 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsHud: {
    position: 'absolute',
    top: SPACING.xl + 44,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface + 'F0',
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  errorBanner: {
    position: 'absolute',
    top: SPACING.xl + 120,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.danger + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.sm },
  nameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  nameCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 340,
  },
  nameTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  nameInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  nameInputWrapper: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  nameInput: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  saveButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface + 'E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
  },
  mainButtonStop: {
    backgroundColor: COLORS.danger,
  },
  mainButtonText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
