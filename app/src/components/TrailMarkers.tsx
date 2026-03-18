import { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { TRAIL_LINE_COLORS } from '@/constants';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';

interface Props {
  onTrailPress?: (slug: string) => void;
}

export default function TrailMarkers({ onTrailPress }: Props) {
  const { trails } = useSupabaseTrails();
  const geojson = useMemo(() => {
    const features = trails.map((trail) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [trail.start_point.longitude, trail.start_point.latitude],
      },
      properties: {
        slug: trail.slug,
        name: trail.name,
        difficulty: trail.difficulty,
        color: TRAIL_LINE_COLORS[trail.difficulty] ?? '#FFFFFF',
      },
    }));
    return { type: 'FeatureCollection' as const, features };
  }, [trails]);

  return (
    <MapLibreGL.ShapeSource
      id="trail-starts"
      shape={geojson}
      onPress={(e) => {
        const feature = e.features?.[0];
        if (feature && onTrailPress) {
          const slug = feature.properties?.slug;
          if (typeof slug === 'string') onTrailPress(slug);
        }
      }}
    >
      <MapLibreGL.CircleLayer
        id="trail-start-circles"
        style={{
          circleRadius: 8,
          circleColor: ['get', 'color'],
          circleStrokeWidth: 2,
          circleStrokeColor: '#FFFFFF',
          circleOpacity: 0.9,
        }}
      />
      <MapLibreGL.SymbolLayer
        id="trail-start-labels"
        minZoomLevel={12}
        style={{
          textField: ['get', 'name'],
          textSize: 11,
          textColor: '#FFFFFF',
          textHaloColor: '#000000',
          textHaloWidth: 1,
          textOffset: [0, 1.5],
          textAnchor: 'top',
          textMaxWidth: 12,
        }}
      />
    </MapLibreGL.ShapeSource>
  );
}
