import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import BaseMap from './BaseMap';
import { ZONES } from '@/lib/zones';
import { useProgressStore } from '@/stores/progressStore';
import { REUNION_CENTER, REUNION_ZOOM } from '@/constants';

const GRAY = '#374151';
const GREEN_100 = '#16A34A';

interface Props {
  height?: number;
}

export default function IslandProgressMap({ height = 300 }: Props) {
  const { zoneProgress } = useProgressStore();

  const geojson = useMemo(() => {
    const features = ZONES.map((zone) => {
      const progress = zoneProgress.find((z) => z.zoneSlug === zone.slug)?.progress ?? 0;
      let fillColor = GRAY;
      if (progress > 0 && progress < 1) {
        const r = Math.round(187 - progress * 165);
        const g = Math.round(247 - progress * 51);
        const b = Math.round(208 - progress * 138);
        fillColor = `rgb(${r}, ${g}, ${b})`;
      } else if (progress >= 1) {
        fillColor = GREEN_100;
      }
      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [zone.polygon] },
        properties: { slug: zone.slug, name: zone.name, progress, fillColor },
      };
    });
    return { type: 'FeatureCollection' as const, features };
  }, [zoneProgress]);

  return (
    <View style={[styles.container, { height }]}>
      <BaseMap
        centerCoordinate={[REUNION_CENTER.longitude, REUNION_CENTER.latitude]}
        zoomLevel={REUNION_ZOOM}
      >
        <MapLibreGL.ShapeSource id="zones-progress" shape={geojson}>
          <MapLibreGL.FillLayer
            id="zones-fill"
            style={{
              fillColor: ['get', 'fillColor'],
              fillOpacity: 0.7,
              fillOutlineColor: '#FFFFFF',
            }}
          />
          <MapLibreGL.SymbolLayer
            id="zones-labels"
            minZoomLevel={10}
            style={{
              textField: ['get', 'name'],
              textSize: 10,
              textColor: '#FFFFFF',
              textHaloColor: '#000000',
              textHaloWidth: 1,
            }}
          />
        </MapLibreGL.ShapeSource>
      </BaseMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden' },
});
