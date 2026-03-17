import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL, { type CameraRef } from '@maplibre/maplibre-react-native';
import {
  REUNION_CENTER,
  REUNION_ZOOM,
  REUNION_BOUNDS,
  MAP_STYLE_DARK,
} from '@/constants';

MapLibreGL.setAccessToken(null);

interface Props {
  children?: React.ReactNode;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  showUserLocation?: boolean;
  onPress?: (feature: GeoJSON.Feature) => void;
}

export default function BaseMap({
  children,
  centerCoordinate,
  zoomLevel,
  showUserLocation = false,
  onPress,
}: Props) {
  const cameraRef = useRef<CameraRef>(null);
  const center = centerCoordinate ?? [REUNION_CENTER.longitude, REUNION_CENTER.latitude];
  const zoom = zoomLevel ?? REUNION_ZOOM;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={MAP_STYLE_DARK}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={onPress}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: zoom,
          }}
          maxBounds={{
            ne: REUNION_BOUNDS.ne,
            sw: REUNION_BOUNDS.sw,
          }}
          minZoomLevel={8}
          maxZoomLevel={17}
        />
        {showUserLocation && (
          <MapLibreGL.UserLocation visible renderMode="native" androidRenderMode="compass" />
        )}
        {children}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
