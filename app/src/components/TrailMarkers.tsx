import { useCallback, useMemo, useRef } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { TRAIL_LINE_COLORS, COLORS } from '@/constants';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';

interface Props {
  onTrailPress?: (slug: string) => void;
  onClusterPress?: (coordinates: [number, number], zoom: number) => void;
}

export default function TrailMarkers({ onTrailPress, onClusterPress }: Props) {
  const { trails } = useSupabaseTrails();
  const shapeSourceRef = useRef<MapLibreGL.ShapeSource>(null);

  const geojson = useMemo(() => {
    const features = trails
      .filter((trail) => trail.start_point !== null)
      .map((trail) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [trail.start_point!.longitude, trail.start_point!.latitude],
        },
        properties: {
          slug: trail.slug,
          name: trail.name,
          difficulty: trail.difficulty,
          color: TRAIL_LINE_COLORS[trail.difficulty] ?? COLORS.white,
        },
      }));
    return { type: 'FeatureCollection' as const, features };
  }, [trails]);

  const handlePress = useCallback(async (e: { features?: GeoJSON.Feature[] }) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const isCluster = feature.properties?.cluster === true || feature.properties?.point_count;

    if (isCluster && onClusterPress) {
      const coords = (feature.geometry as unknown as { coordinates: [number, number] }).coordinates;

      // Use getClusterExpansionZoom for the optimal zoom level
      let zoom: number;
      try {
        const clusterId = feature.properties?.cluster_id;
        if (shapeSourceRef.current && clusterId != null) {
          const expansionZoom = await shapeSourceRef.current.getClusterExpansionZoom(feature);
          zoom = Math.min(expansionZoom, 17);
        } else {
          // Fallback if ref or cluster_id unavailable
          const count = feature.properties?.point_count ?? 10;
          zoom = count > 100 ? 11 : count > 20 ? 12 : 14;
        }
      } catch {
        // Fallback on error
        const count = feature.properties?.point_count ?? 10;
        zoom = count > 100 ? 11 : count > 20 ? 12 : 14;
      }

      onClusterPress(coords, zoom);
    } else if (onTrailPress) {
      const slug = feature.properties?.slug;
      if (typeof slug === 'string') onTrailPress(slug);
    }
  }, [onClusterPress, onTrailPress]);

  return (
    <MapLibreGL.ShapeSource
      ref={shapeSourceRef}
      id="trail-starts"
      shape={geojson}
      cluster={true}
      clusterRadius={40}
      clusterMaxZoomLevel={13}
      onPress={handlePress}
      hitbox={{ width: 44, height: 44 }}
    >
      {/* Cluster circles */}
      <MapLibreGL.CircleLayer
        id="trail-cluster-circles"
        filter={['has', 'point_count']}
        style={{
          circleRadius: [
            'step',
            ['get', 'point_count'],
            16,
            10, 20,
            50, 26,
            100, 32,
          ],
          circleColor: COLORS.primary,
          circleStrokeWidth: 2,
          circleStrokeColor: COLORS.white,
          circleOpacity: 0.9,
        }}
      />

      {/* Cluster count text */}
      <MapLibreGL.SymbolLayer
        id="trail-cluster-count"
        filter={['has', 'point_count']}
        style={{
          textField: ['get', 'point_count_abbreviated'],
          textSize: 13,
          textColor: COLORS.white,
          textFont: ['Open Sans Bold'],
          textAllowOverlap: true,
        }}
      />

      {/* Individual (unclustered) markers */}
      <MapLibreGL.CircleLayer
        id="trail-start-circles"
        filter={['!', ['has', 'point_count']]}
        style={{
          circleRadius: 8,
          circleColor: ['get', 'color'],
          circleStrokeWidth: 2,
          circleStrokeColor: COLORS.white,
          circleOpacity: 0.9,
        }}
      />
      <MapLibreGL.SymbolLayer
        id="trail-start-labels"
        filter={['!', ['has', 'point_count']]}
        minZoomLevel={12}
        style={{
          textField: ['get', 'name'],
          textSize: 11,
          textColor: COLORS.white,
          textHaloColor: COLORS.black,
          textHaloWidth: 1,
          textOffset: [0, 1.5],
          textAnchor: 'top',
          textMaxWidth: 12,
        }}
      />
    </MapLibreGL.ShapeSource>
  );
}
