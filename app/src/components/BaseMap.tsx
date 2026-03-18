import { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL, { type CameraRef } from '@maplibre/maplibre-react-native';
import {
  REUNION_CENTER,
  REUNION_ZOOM,
  REUNION_BOUNDS,
  MAP_STYLE_LIGHT,
} from '@/constants';

MapLibreGL.setAccessToken(null);

export interface BaseMapHandle {
  flyTo: (coords: [number, number], zoom: number) => void;
}

interface Props {
  children?: React.ReactNode;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  showUserLocation?: boolean;
  onPress?: (feature: GeoJSON.Feature) => void;
}

const BaseMap = forwardRef<BaseMapHandle, Props>(function BaseMap({
  children,
  centerCoordinate,
  zoomLevel,
  showUserLocation = false,
  onPress,
}, ref) {
  const cameraRef = useRef<CameraRef>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (coords: [number, number], zoom: number) => {
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: zoom,
        animationDuration: 500,
      });
    },
  }));
  const mapStyle = MAP_STYLE_LIGHT;
  const center = centerCoordinate ?? [REUNION_CENTER.longitude, REUNION_CENTER.latitude];
  const zoom = zoomLevel ?? REUNION_ZOOM;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={mapStyle}
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
});

export default BaseMap;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
