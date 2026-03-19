import { useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL, { type CameraRef, type MapViewRef } from '@maplibre/maplibre-react-native';
import {
  REUNION_CENTER,
  REUNION_ZOOM,
  REUNION_BOUNDS,
  MAP_STYLE_LIGHT,
  MAP_STYLE_DARK,
  COLORS,
} from '@/constants';

MapLibreGL.setAccessToken(null);

export interface BaseMapHandle {
  flyTo: (coords: [number, number], zoom: number) => void;
  getZoom: () => Promise<number>;
  getCenter: () => Promise<[number, number]>;
}

// Le style peut etre une URL string (Positron/Dark) ou un objet JSON (Topo raster)
type MapStyleValue = string | Record<string, unknown>;

interface Props {
  children?: React.ReactNode;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  showUserLocation?: boolean;
  userPosition?: { latitude: number; longitude: number } | null;
  onPress?: (feature: GeoJSON.Feature) => void;
  onMapPress?: (event: { features?: GeoJSON.Feature[]; geometry?: { coordinates: [number, number] } }) => void;
  mapStyle?: MapStyleValue;
  /** Basculer automatiquement en MAP_STYLE_DARK entre sunset et sunrise */
  autoNight?: boolean;
  /** Heures sunrise/sunset au format ISO ou "HH:MM" pour le mode nuit auto */
  sunrise?: string;
  sunset?: string;
  /** Orienter la carte selon le heading GPS (heading-up) */
  followHeading?: boolean;
  /** Heading GPS en degres (0-360) pour le mode heading-up */
  heading?: number;
}

const BaseMap = forwardRef<BaseMapHandle, Props>(function BaseMap({
  children,
  centerCoordinate,
  zoomLevel,
  showUserLocation = false,
  userPosition = null,
  onPress,
  onMapPress,
  mapStyle: mapStyleProp,
  autoNight = false,
  sunrise,
  sunset,
  followHeading = false,
  heading,
}, ref) {
  const cameraRef = useRef<CameraRef>(null);
  const mapViewRef = useRef<MapViewRef>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (coords: [number, number], zoom: number) => {
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: zoom,
        animationDuration: 500,
      });
    },
    getZoom: async () => {
      if (mapViewRef.current) {
        return mapViewRef.current.getZoom();
      }
      return zoom ?? REUNION_ZOOM;
    },
    getCenter: async () => {
      if (mapViewRef.current) {
        const center = await mapViewRef.current.getCenter();
        return center as [number, number];
      }
      return [REUNION_CENTER.longitude, REUNION_CENTER.latitude];
    },
  }));
  // Mode nuit automatique : comparer l'heure actuelle avec sunrise/sunset
  const isNightTime = useMemo(() => {
    if (!autoNight || !sunrise || !sunset) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Extraire les minutes depuis minuit a partir d'un string ISO ou "HH:MM"
    const parseTimeToMinutes = (timeStr: string): number => {
      // Format ISO "2026-03-19T06:30" ou format "HH:MM"
      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return -1;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };

    const sunriseMin = parseTimeToMinutes(sunrise);
    const sunsetMin = parseTimeToMinutes(sunset);

    if (sunriseMin < 0 || sunsetMin < 0) return false;

    // Nuit = avant le lever ou apres le coucher
    return currentMinutes < sunriseMin || currentMinutes > sunsetMin;
  }, [autoNight, sunrise, sunset]);

  const mapStyle = isNightTime ? MAP_STYLE_DARK : (mapStyleProp ?? MAP_STYLE_LIGHT);
  const center = centerCoordinate ?? [REUNION_CENTER.longitude, REUNION_CENTER.latitude];
  const zoom = zoomLevel ?? REUNION_ZOOM;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapViewRef}
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={(event: unknown) => {
          const e = event as { features?: GeoJSON.Feature[]; geometry?: { coordinates: [number, number] } };
          if (onMapPress) onMapPress(e);
          if (onPress && e.features?.[0]) onPress(e.features[0]);
        }}
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
          heading={followHeading && heading !== undefined ? heading : 0}
          animationMode="easeTo"
          animationDuration={300}
        />
        {showUserLocation && (
          <MapLibreGL.UserLocation visible renderMode="native" androidRenderMode="compass" />
        )}
        {/* Custom blue dot marker — fallback for devices where UserLocation does not render */}
        {userPosition && (
          <MapLibreGL.ShapeSource
            id="user-location-custom"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [userPosition.longitude, userPosition.latitude],
              },
              properties: {},
            }}
          >
            <MapLibreGL.CircleLayer
              id="user-location-halo"
              style={{
                circleRadius: 20,
                circleColor: COLORS.info,
                circleOpacity: 0.15,
              }}
            />
            <MapLibreGL.CircleLayer
              id="user-location-dot"
              style={{
                circleRadius: 8,
                circleColor: COLORS.info,
                circleStrokeWidth: 3,
                circleStrokeColor: COLORS.white,
              }}
            />
          </MapLibreGL.ShapeSource>
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
