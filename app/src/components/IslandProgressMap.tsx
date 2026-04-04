import { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import BaseMap from './BaseMap';
import { ZONES } from '@/lib/zones';
import { useProgressStore } from '@/stores/progressStore';
import { REUNION_CENTER, REUNION_ZOOM, COLORS, BORDER_RADIUS, SPACING, FONT_SIZE } from '@/constants';

type MapMode = 'progression' | 'legende' | 'zones';

const MODE_LABELS: { key: MapMode; label: string }[] = [
  { key: 'progression', label: 'Ma progression' },
  { key: 'legende', label: 'Apercu' },
  { key: 'zones', label: 'Zones' },
];

const GOLD = COLORS.gold;
const FOG_MAX_OPACITY = 0.7;

interface Props {
  height?: number;
  interactive?: boolean;
}

export default function IslandProgressMap({ height = 300, interactive = false }: Props) {
  const { zoneProgress } = useProgressStore();
  const [mode, setMode] = useState<MapMode>('progression');
  const [tooltip, setTooltip] = useState<{
    name: string;
    completed: number;
    total: number;
    coordinate: [number, number];
  } | null>(null);

  // --- Fog of War GeoJSON: zone polygons with opacity inversely proportional to progress ---
  const fogGeojson = useMemo(() => {
    const features = ZONES.map((zone) => {
      const zp = zoneProgress.find((z) => z.zoneSlug === zone.slug);
      const progress = zp?.progress ?? 0;
      const isComplete = progress >= 1;

      let fogOpacity: number;
      let outlineColor: string;
      let fillColor: string;

      if (mode === 'legende') {
        // All zones fully revealed — golden/green, no fog
        fogOpacity = 0;
        fillColor = GOLD;
        outlineColor = GOLD;
      } else if (mode === 'zones') {
        // Simple view — light fill, no fog effect
        fogOpacity = 0.15;
        fillColor = zone.color;
        outlineColor = zone.color;
      } else {
        // "Ma progression" — fog of war
        fogOpacity = FOG_MAX_OPACITY * (1 - progress);
        fillColor = COLORS.black;
        outlineColor = isComplete ? GOLD : COLORS.white;
      }

      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [zone.polygon] },
        properties: {
          slug: zone.slug,
          name: zone.name,
          progress,
          fogOpacity,
          fillColor,
          outlineColor,
          isComplete: isComplete ? 1 : 0,
          completedTrails: zp?.completedTrails ?? 0,
          totalTrails: zp?.totalTrails ?? 0,
          zoneColor: zone.color,
          // Label for zones mode
          label: `${zone.name}\n${Math.round(progress * 100)}%`,
        },
      };
    });
    return { type: 'FeatureCollection' as const, features };
  }, [zoneProgress, mode]);

  // --- Revealed zones overlay (colored fill for zones with progress > 0, in progression mode) ---
  const revealedGeojson = useMemo(() => {
    if (mode !== 'progression') return { type: 'FeatureCollection' as const, features: [] };
    const features = ZONES
      .filter((zone) => {
        const zp = zoneProgress.find((z) => z.zoneSlug === zone.slug);
        return (zp?.progress ?? 0) > 0;
      })
      .map((zone) => {
        const zp = zoneProgress.find((z) => z.zoneSlug === zone.slug);
        const progress = zp?.progress ?? 0;
        const isComplete = progress >= 1;
        return {
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [zone.polygon] },
          properties: {
            fillColor: isComplete ? GOLD : zone.color,
            fillOpacity: isComplete ? 0.35 : Math.min(0.15 + progress * 0.25, 0.4),
          },
        };
      });
    return { type: 'FeatureCollection' as const, features };
  }, [zoneProgress, mode]);

  // --- Legende mode: colored zones ---
  const legendeGeojson = useMemo(() => {
    if (mode !== 'legende') return { type: 'FeatureCollection' as const, features: [] };
    const features = ZONES.map((zone) => ({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [zone.polygon] },
      properties: {
        fillColor: zone.color,
        fillOpacity: 0.5,
      },
    }));
    return { type: 'FeatureCollection' as const, features };
  }, [mode]);

  // Handle zone tap for tooltip
  const handleZonePress = useCallback(
    (event: { features?: GeoJSON.Feature[] }) => {
      if (!interactive || !event.features?.length) {
        setTooltip(null);
        return;
      }
      const feature = event.features[0];
      const props = feature.properties as {
        name?: string;
        completedTrails?: number;
        totalTrails?: number;
        slug?: string;
      };
      if (!props?.name) return;

      const zone = ZONES.find((z) => z.slug === props.slug);
      if (!zone) return;

      setTooltip({
        name: props.name,
        completed: props.completedTrails ?? 0,
        total: props.totalTrails ?? 0,
        coordinate: zone.center,
      });
    },
    [interactive],
  );

  const dismissTooltip = useCallback(() => setTooltip(null), []);

  return (
    <View style={[styles.container, { height }]}>
      {/* Mode toggle */}
      <View style={styles.toggleContainer}>
        {MODE_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.toggleButton, mode === key && styles.toggleButtonActive]}
            onPress={() => { setMode(key); setTooltip(null); }}
            accessibilityLabel={`Mode ${label}`}
            accessibilityRole="button"
          >
            <Text style={[styles.toggleText, mode === key && styles.toggleTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.mapWrapper}>
        <BaseMap
          centerCoordinate={[REUNION_CENTER.longitude, REUNION_CENTER.latitude]}
          zoomLevel={REUNION_ZOOM}
          onMapPress={dismissTooltip}
        >
          {/* Layer 1: Revealed zone color underneath (progression mode) */}
          {mode === 'progression' && revealedGeojson.features.length > 0 && (
            <Mapbox.ShapeSource id="zones-revealed" shape={revealedGeojson}>
              <Mapbox.FillLayer
                id="zones-revealed-fill"
                style={{
                  fillColor: ['get', 'fillColor'],
                  fillOpacity: ['get', 'fillOpacity'],
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* Layer 1b: Legende mode colored zones */}
          {mode === 'legende' && legendeGeojson.features.length > 0 && (
            <Mapbox.ShapeSource id="zones-legende" shape={legendeGeojson}>
              <Mapbox.FillLayer
                id="zones-legende-fill"
                style={{
                  fillColor: ['get', 'fillColor'],
                  fillOpacity: ['get', 'fillOpacity'],
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* Layer 2: Fog overlay / zone fills */}
          <Mapbox.ShapeSource
            id="zones-fog"
            shape={fogGeojson}
            onPress={interactive ? handleZonePress : undefined}
          >
            <Mapbox.FillLayer
              id="zones-fog-fill"
              style={{
                fillColor: ['get', 'fillColor'],
                fillOpacity: ['get', 'fogOpacity'],
              }}
            />
            {/* Border glow — gold for complete zones, white for others */}
            <Mapbox.LineLayer
              id="zones-outline"
              style={{
                lineColor: ['get', 'outlineColor'],
                lineWidth: [
                  'case',
                  ['==', ['get', 'isComplete'], 1],
                  3,
                  1,
                ],
                lineOpacity: 0.8,
              }}
            />
            {/* Gold glow halo for completed zones */}
            {mode === 'progression' && (
              <Mapbox.LineLayer
                id="zones-glow"
                style={{
                  lineColor: GOLD,
                  lineWidth: 6,
                  lineOpacity: 0.3,
                  lineBlur: 4,
                }}
                filter={['==', ['get', 'isComplete'], 1]}
              />
            )}

            {/* Labels */}
            <Mapbox.SymbolLayer
              id="zones-labels"
              minZoomLevel={mode === 'zones' ? 9 : 10}
              style={{
                textField: mode === 'zones' ? ['get', 'label'] : ['get', 'name'],
                textSize: mode === 'zones' ? 11 : 10,
                textColor: mode === 'legende' ? COLORS.textPrimary : COLORS.white,
                textHaloColor: COLORS.black,
                textHaloWidth: 1,
                textAllowOverlap: mode === 'zones',
              }}
            />
          </Mapbox.ShapeSource>

          {/* Tooltip annotation */}
          {tooltip && (
            <Mapbox.MarkerView coordinate={tooltip.coordinate}>
              <View style={styles.tooltipBubble}>
                <Text style={styles.tooltipTitle}>{tooltip.name}</Text>
                <Text style={styles.tooltipDetail}>
                  {tooltip.completed}/{tooltip.total} sentiers
                </Text>
              </View>
            </Mapbox.MarkerView>
          )}
        </BaseMap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: 2,
    marginBottom: SPACING.xs,
    zIndex: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.primaryLight,
  },
  mapWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  tooltipBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    minWidth: 100,
  },
  tooltipTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tooltipDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
