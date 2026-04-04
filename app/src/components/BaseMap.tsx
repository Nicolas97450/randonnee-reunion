import { useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox, { type CameraRef, type MapViewRef } from '@rnmapbox/maps';
import {
  REUNION_CENTER,
  REUNION_ZOOM,
  REUNION_BOUNDS,
  MAP_STYLE_DEFAULT,
  MAP_STYLE_DARK,
  COLORS,
} from '@/constants';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (!mapboxToken && __DEV__) {
  console.error('EXPO_PUBLIC_MAPBOX_TOKEN is missing — map will not load');
}
Mapbox.setAccessToken(mapboxToken ?? '');

export interface BaseMapHandle {
  flyTo: (coords: [number, number], zoom: number) => void;
  getZoom: () => Promise<number>;
  getCenter: () => Promise<[number, number]>;
}

// Le style est toujours une URL string avec Mapbox
type MapStyleValue = string;

interface Props {
  children?: React.ReactNode;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  showUserLocation?: boolean;
  userPosition?: { latitude: number; longitude: number } | null;
  onPress?: (feature: GeoJSON.Feature) => void;
  onMapPress?: (event: { features?: GeoJSON.Feature[]; geometry?: { coordinates: [number, number] } }) => void;
  onRegionDidChange?: () => void;
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
  /** Activer le terrain 3D Mapbox (relief exagere). Desactive par defaut pour la perf. */
  terrain3d?: boolean;
  /** Pitch de la camera en degres (0 = vue du dessus, 60 = vue inclinee) */
  pitch?: number;
}

const BaseMap = forwardRef<BaseMapHandle, Props>(function BaseMap({
  children,
  centerCoordinate,
  zoomLevel,
  showUserLocation = false,
  userPosition = null,
  onPress,
  onMapPress,
  onRegionDidChange,
  mapStyle: mapStyleProp,
  autoNight = false,
  sunrise,
  sunset,
  followHeading = false,
  heading,
  terrain3d = false,
  pitch,
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

  const mapStyle = isNightTime ? MAP_STYLE_DARK : (mapStyleProp ?? MAP_STYLE_DEFAULT);
  const center = centerCoordinate ?? [REUNION_CENTER.longitude, REUNION_CENTER.latitude];
  const zoom = zoomLevel ?? REUNION_ZOOM;

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapViewRef}
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={onRegionDidChange}
        onPress={(event: unknown) => {
          const e = event as { features?: GeoJSON.Feature[]; geometry?: { coordinates: [number, number] } };
          if (onMapPress) onMapPress(e);
          if (onPress && e.features?.[0]) onPress(e.features[0]);
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: zoom,
          }}
          minZoomLevel={5}
          maxZoomLevel={17}
          heading={followHeading && heading !== undefined ? heading : 0}
          pitch={pitch ?? 0}
          animationMode="easeTo"
          animationDuration={300}
        />
        {/* Terrain 3D — relief Mapbox DEM */}
        {terrain3d && (
          <>
            <Mapbox.RasterDemSource
              id="mapbox-dem"
              url="mapbox://mapbox.mapbox-terrain-dem-v1"
              tileSize={512}
              maxZoomLevel={14}
            >
              <Mapbox.SkyLayer
                id="sky-layer"
                style={{
                  skyType: 'atmosphere',
                  skyAtmosphereSun: [0, 0],
                  skyAtmosphereSunIntensity: 15,
                }}
              />
            </Mapbox.RasterDemSource>
            <Mapbox.Terrain
              sourceID="mapbox-dem"
              style={{ exaggeration: 1.5 }}
            />
            <Mapbox.Atmosphere
              style={{
                color: 'rgb(186, 210, 235)',
                highColor: 'rgb(36, 92, 223)',
                horizonBlend: 0.02,
                spaceColor: 'rgb(11, 11, 25)',
                starIntensity: 0.6,
              }}
            />
          </>
        )}
        {showUserLocation && (
          <Mapbox.UserLocation visible renderMode="native" androidRenderMode="compass" />
        )}
        {/* Custom blue dot marker — fallback for devices where UserLocation does not render */}
        {userPosition && (
          <Mapbox.ShapeSource
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
            <Mapbox.CircleLayer
              id="user-location-halo"
              style={{
                circleRadius: 8,
                circleColor: COLORS.info,
                circleOpacity: 0.15,
              }}
            />
            <Mapbox.CircleLayer
              id="user-location-dot"
              style={{
                circleRadius: 4,
                circleColor: COLORS.info,
                circleStrokeWidth: 1.5,
                circleStrokeColor: COLORS.white,
              }}
            />
          </Mapbox.ShapeSource>
        )}
        {children}
      </Mapbox.MapView>
    </View>
  );
});

export default BaseMap;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
