import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, TRAIL_ZOOM } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import DifficultyBadge from '@/components/DifficultyBadge';
import DownloadButton from '@/components/DownloadButton';
import WeatherWidget from '@/components/WeatherWidget';
import TrailStatusBadge from '@/components/TrailStatusBadge';
import TrailReportCard from '@/components/TrailReportCard';
import SOSButton from '@/components/SOSButton';
import Mapbox from '@rnmapbox/maps';
import BaseMap, { type BaseMapHandle } from '@/components/BaseMap';
import PhotoModal from '@/components/PhotoModal';
import ReviewModal from '@/components/ReviewModal';
import StarRating from '@/components/StarRating';
import TrailStatsGrid from '@/components/TrailStatsGrid';
import TrailTabBar, { type TabKey } from '@/components/TrailTabBar';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { useTrailDetail } from '@/hooks/useTrailDetail';
import { useTrailTrace } from '@/hooks/useTrailTrace';
import { useWeather } from '@/hooks/useWeather';
import { useTrailReports } from '@/hooks/useTrailReports';
import { useTrailStatus } from '@/hooks/useTrailStatus';
import { useTrailPhotos, useUploadTrailPhoto } from '@/hooks/useTrailPhotos';
import type { TrailPhoto } from '@/hooks/useTrailPhotos';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';
import { useElevation } from '@/hooks/useElevation';
import ElevationProfile from '@/components/ElevationProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useTrailReviews, useAverageRating, useCreateReview } from '@/hooks/useTrailReviews';
import { useAuthStore } from '@/stores/authStore';

const PHOTO_SIZE = 120;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<TrailStackParamList, 'TrailDetail'>;

export default function TrailDetailScreen({ route }: Props) {
  const { trailId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();

  const { trails, isLoading: trailsLoading } = useSupabaseTrails();
  const trailBase = useMemo(() => {
    return trails.find((t) => t.slug === trailId);
  }, [trails, trailId]);

  // Charger description + gpx_url separement (pas dans la liste legere)
  const { data: trailDetail } = useTrailDetail(trailId);

  // Fusionner les donnees legeres + detail
  const trail = useMemo(() => {
    if (!trailBase) return undefined;
    return {
      ...trailBase,
      description: trailDetail?.description ?? trailBase.description ?? '',
      gpx_url: trailDetail?.gpx_url ?? trailBase.gpx_url,
    };
  }, [trailBase, trailDetail]);

  // Custom back button + dynamic title
  useEffect(() => {
    navigation.setOptions({
      title: trail?.name ?? '',
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('TrailList');
            }
          }}
          style={{ minWidth: SPACING.xxl, minHeight: SPACING.xxl, justifyContent: 'center', alignItems: 'center' }}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
      ),
    });
  }, [trail?.name, navigation]);

  const { data: weather, isLoading: weatherLoading } = useWeather(
    trail?.start_point?.latitude,
    trail?.start_point?.longitude,
  );

  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: trailStatus } = useTrailStatus(trail?.name ?? '');
  const { data: reports = [] } = useTrailReports(trail?.slug ?? '');
  const { data: trailTrace } = useTrailTrace(trail?.slug ?? '');
  const { data: elevationData, isLoading: elevationLoading } = useElevation(trailTrace?.coordinates);
  const { data: photos = [], isLoading: photosLoading } = useTrailPhotos(trail?.slug);
  const uploadPhoto = useUploadTrailPhoto(trail?.slug);
  const userId = useAuthStore((s) => s.user?.id);
  const { data: reviews = [] } = useTrailReviews(trail?.slug ?? '');
  const { data: avgRating } = useAverageRating(trail?.slug ?? '');
  const createReview = useCreateReview();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TrailPhoto | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('infos');

  // Flyover
  const mapRef = useRef<BaseMapHandle>(null);
  const flyoverDone = useRef(false);

  const handleSubmitReview = useCallback(() => {
    if (!userId) {
      Alert.alert('Connexion requise', 'Connecte-toi pour laisser un avis.');
      return;
    }
    if (reviewRating === 0) {
      Alert.alert('Note requise', 'Selectionne une note entre 1 et 5.');
      return;
    }
    createReview.mutate(
      { slug: trail?.slug ?? '', userId, rating: reviewRating, comment: reviewComment.trim() || undefined },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewRating(0);
          setReviewComment('');
        },
        onError: () => {
          Alert.alert('Erreur', 'Impossible de publier ton avis. Reessaye.');
        },
      },
    );
  }, [userId, reviewRating, reviewComment, trail?.slug, createReview]);

  const handleUploadPhoto = useCallback(() => {
    if (!userId) return;
    uploadPhoto.mutate(userId);
  }, [userId, uploadPhoto]);

  const trailTraceGeoJson = useMemo(() => {
    if (!trailTrace) return null;
    return { type: 'Feature' as const, geometry: trailTrace, properties: {} };
  }, [trailTrace]);

  // Flyover automatique au chargement de la carte
  useEffect(() => {
    if (flyoverDone.current) return;
    if (!trailTrace || trailTrace.coordinates.length < 4) return;
    flyoverDone.current = true;

    const coords = trailTrace.coordinates;
    const stepCount = 6;
    const stepDuration = 500;
    const stepSize = Math.floor(coords.length / stepCount);

    const timeout = setTimeout(() => {
      mapRef.current?.flyTo(
        [coords[0][0], coords[0][1]],
        14,
      );
    }, 300);

    const timeouts = [timeout];

    for (let i = 1; i <= stepCount; i++) {
      const idx = Math.min(i * stepSize, coords.length - 1);
      const t = setTimeout(() => {
        mapRef.current?.flyTo(
          [coords[idx][0], coords[idx][1]],
          14,
        );
      }, 300 + i * stepDuration);
      timeouts.push(t);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [trailTrace]);

  if (trailsLoading && !trail) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.loadingText}>Chargement du sentier...</Text>
      </View>
    );
  }

  if (!trail) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="trail-sign-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.errorTitle}>Sentier introuvable</Text>
        <Text style={styles.errorSubtitle}>Ce sentier n'existe pas ou a ete supprime.</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour a la liste"
        >
          <Text style={styles.backButtonText}>Retour a la liste</Text>
        </Pressable>
      </View>
    );
  }

  // Compute map center: prefer trace midpoint, fallback to start_point
  const mapCenter = useMemo<[number, number] | null>(() => {
    if (trailTrace && trailTrace.coordinates.length > 0) {
      const midIdx = Math.floor(trailTrace.coordinates.length / 2);
      return trailTrace.coordinates[midIdx];
    }
    if (trail.start_point) {
      return [trail.start_point.longitude, trail.start_point.latitude];
    }
    return null;
  }, [trailTrace, trail.start_point]);

  const showMiniMap = mapCenter !== null;

  // Index of the tabBar among direct ScrollView children (for stickyHeaderIndices)
  // Children order: header, region, statsGrid, [miniMap], tabBar
  const tabBarIndex = showMiniMap ? 4 : 3;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[tabBarIndex]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{trail.name}</Text>
          <Pressable
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(trail.slug)}
            accessibilityLabel={isFavorite(trail.slug) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Ionicons
              name={isFavorite(trail.slug) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(trail.slug) ? COLORS.danger : COLORS.textSecondary}
            />
          </Pressable>
          <DifficultyBadge difficulty={trail.difficulty} />
        </View>

        <Text style={styles.region}>{trail.region}</Text>

        {/* Stats compacts - using extracted component */}
        <TrailStatsGrid
          distance={formatDistance(trail.distance_km)}
          elevation={formatElevation(trail.elevation_gain_m)}
          duration={formatDuration(trail.duration_min)}
          type={trail.trail_type}
        />

        {/* Mini-carte toujours visible */}
        {showMiniMap && (
          <View style={styles.miniMapContainer}>
            <BaseMap
              ref={mapRef}
              centerCoordinate={mapCenter}
              zoomLevel={TRAIL_ZOOM}
            >
              {/* Trace du sentier (couleur unique bleu) */}
              {trailTraceGeoJson && (
                <Mapbox.ShapeSource id="detail-trail-trace" shape={trailTraceGeoJson}>
                  <Mapbox.LineLayer
                    id="detail-trail-trace-line"
                    style={{
                      lineWidth: 4,
                      lineOpacity: 0.85,
                      lineColor: COLORS.info,
                    }}
                  />
                </Mapbox.ShapeSource>
              )}
              {/* Marqueur D (depart) — affiche D/A si boucle */}
              {trailTrace && trailTrace.coordinates.length >= 2 && (() => {
                const first = trailTrace.coordinates[0];
                const last = trailTrace.coordinates[trailTrace.coordinates.length - 1];
                const dLat = first[1] - last[1];
                const dLng = first[0] - last[0];
                const isLoop = Math.sqrt(dLat * dLat + dLng * dLng) * 111000 < 50;
                return (
                  <>
                    <Mapbox.ShapeSource
                      id="detail-start-marker"
                      shape={{
                        type: 'Feature' as const,
                        geometry: { type: 'Point' as const, coordinates: first },
                        properties: {},
                      }}
                    >
                      <Mapbox.SymbolLayer
                        id="detail-start-label"
                        style={{
                          textField: isLoop ? 'D/A' : 'D',
                          textSize: 11,
                          textColor: COLORS.primaryLight,
                          textHaloColor: COLORS.black,
                          textHaloWidth: 1.5,
                          textOffset: [0, -1.5],
                          textFont: ['Open Sans Bold'],
                          textAllowOverlap: true,
                        }}
                      />
                    </Mapbox.ShapeSource>
                    {!isLoop && (
                      <Mapbox.ShapeSource
                        id="detail-end-marker"
                        shape={{
                          type: 'Feature' as const,
                          geometry: { type: 'Point' as const, coordinates: last },
                          properties: {},
                        }}
                      >
                        <Mapbox.SymbolLayer
                          id="detail-end-label"
                          style={{
                            textField: 'A',
                            textSize: 11,
                            textColor: COLORS.danger,
                            textHaloColor: COLORS.black,
                            textHaloWidth: 1.5,
                            textOffset: [0, -1.5],
                            textFont: ['Open Sans Bold'],
                            textAllowOverlap: true,
                          }}
                        />
                      </Mapbox.ShapeSource>
                    )}
                  </>
                );
              })()}
            </BaseMap>
          </View>
        )}

        {/* Tab bar — using extracted component */}
        <TrailTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* === TAB INFOS === */}
        {activeTab === 'infos' && (
          <>
            {/* Statut ONF */}
            <View style={styles.section}>
              <TrailStatusBadge
                status={trailStatus?.status ?? 'inconnu'}
                message={trailStatus?.message}
              />
            </View>

            {/* Meteo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meteo</Text>
              <WeatherWidget
                forecasts={weather?.forecasts ?? []}
                isLoading={weatherLoading}
              />
            </View>

            {/* Download */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Carte offline</Text>
              <DownloadButton
                trailSlug={trail.slug}
                tilesSizeMb={trail.tiles_size_mb}
                tilesUrl={trail.tiles_url}
              />
            </View>

            {/* Description */}
            {trail.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {showFullDescription || trail.description.length <= 150
                    ? trail.description
                    : `${trail.description.slice(0, 150)}...`}
                </Text>
                {trail.description.length > 150 && (
                  <Pressable
                    onPress={() => setShowFullDescription((prev) => !prev)}
                    accessibilityLabel={showFullDescription ? 'Voir moins de description' : 'Voir plus de description'}
                  >
                    <Text style={styles.toggleText}>
                      {showFullDescription ? 'Voir moins' : 'Voir plus'}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {/* Bouton Organiser une sortie */}
            <View style={styles.section}>
              <Pressable
                style={styles.sortieButton}
                onPress={() => navigation.navigate('CreateSortie', { trailId: trail.slug, trailName: trail.name })}
                accessibilityLabel="Organiser une sortie de groupe"
              >
                <Ionicons name="people" size={18} color={COLORS.primary} />
                <Text style={styles.sortieButtonText}>Organiser une sortie</Text>
              </Pressable>
            </View>

            {/* Signalements terrain */}
            {reports.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Signalements ({reports.length})
                </Text>
                {reports.slice(0, 5).map((report) => (
                  <TrailReportCard key={report.id} report={report} />
                ))}
              </View>
            )}

            {/* Profil d'elevation */}
            {trailTrace && trailTrace.coordinates.length >= 2 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profil d'elevation</Text>
                <ElevationProfile data={elevationData} isLoading={elevationLoading} />
                {elevationData && (
                  <View style={styles.elevationStats}>
                    <View style={styles.elevationStatItem}>
                      <Ionicons name="trending-up" size={16} color={COLORS.primaryLight} />
                      <Text style={styles.elevationStatText}>D+ {elevationData.totalAscent}m</Text>
                    </View>
                    <View style={styles.elevationStatItem}>
                      <Ionicons name="trending-down" size={16} color={COLORS.danger} />
                      <Text style={styles.elevationStatText}>D- {elevationData.totalDescent}m</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* SOS */}
            <View style={styles.section}>
              <SOSButton />
            </View>
          </>
        )}

        {/* === TAB AVIS === */}
        {activeTab === 'avis' && (
          <>
            <View style={styles.section}>
              <View style={styles.reviewHeader}>
                <Text style={styles.sectionTitle}>
                  Avis{avgRating && avgRating.count > 0 ? ` (${avgRating.count})` : ''}
                </Text>
                {avgRating && avgRating.count > 0 && (
                  <View style={styles.avgRatingRow}>
                    <StarRating rating={avgRating.average} />
                    <Text style={styles.avgRatingText}>{avgRating.average}/5</Text>
                  </View>
                )}
              </View>

              {reviews.length > 0 ? (
                reviews.slice(0, 5).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Text style={styles.reviewUsername}>{review.user?.username ?? 'Utilisateur'}</Text>
                      <StarRating rating={review.rating} />
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReviewsText}>
                  Aucun avis pour ce sentier. Sois le premier a donner ton avis !
                </Text>
              )}

              <Pressable
                style={styles.addReviewButton}
                onPress={() => setShowReviewModal(true)}
                accessibilityLabel="Laisser un avis"
              >
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.primaryLight} />
                <Text style={styles.addReviewText}>Laisser un avis</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* === TAB PHOTOS === */}
        {activeTab === 'photos' && (
          <>
            <View style={styles.section}>
              <View style={styles.photoHeader}>
                <Text style={styles.sectionTitle}>
                  Photos{photos.length > 0 ? ` (${photos.length})` : ''}
                </Text>
                {userId && (
                  <Pressable
                    style={[styles.addPhotoButton, uploadPhoto.isPending && { opacity: 0.5 }]}
                    onPress={handleUploadPhoto}
                    disabled={uploadPhoto.isPending}
                    accessibilityLabel="Ajouter une photo du sentier"
                  >
                    {uploadPhoto.isPending ? (
                      <ActivityIndicator size="small" color={COLORS.primaryLight} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={16} color={COLORS.primaryLight} />
                        <Text style={styles.addPhotoText}>Ajouter</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
              {photosLoading ? (
                <ActivityIndicator size="small" color={COLORS.primaryLight} />
              ) : photos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {photos.map((photo) => (
                    <Pressable
                      key={photo.name}
                      onPress={() => setSelectedPhoto(photo)}
                      accessibilityLabel="Voir la photo en plein ecran"
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.noPhotosText}>
                  Aucune photo pour ce sentier. Sois le premier a en ajouter !
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal photo plein ecran — using extracted component */}
      <PhotoModal selectedPhoto={selectedPhoto} onClose={() => setSelectedPhoto(null)} />

      {/* Modal avis — using extracted component */}
      <ReviewModal
        visible={showReviewModal}
        rating={reviewRating}
        comment={reviewComment}
        onRatingChange={setReviewRating}
        onCommentChange={setReviewComment}
        onClose={() => {
          setShowReviewModal(false);
          setReviewRating(0);
          setReviewComment('');
        }}
        onSubmit={handleSubmitReview}
        isLoading={createReview.isPending}
      />

      {/* Sticky CTA bottom bar */}
      <View style={styles.stickyBottomBar}>
        <Pressable
          style={styles.startButton}
          onPress={() => navigation.navigate('Navigation', { trailId: trail.slug })}
          accessibilityLabel="Commencer la randonnee"
        >
          <Ionicons name="navigate" size={22} color={COLORS.white} />
          <Text style={styles.startButtonText}>Commencer la randonnee</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 160,
  },
  miniMapContainer: {
    height: 150,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  favoriteButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  region: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  errorTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  backButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  sortieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  sortieButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  startButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.black,
  },
  elevationStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  elevationStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  elevationStatText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    minHeight: SPACING.xxl,
  },
  addPhotoText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  photoThumbnail: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  noPhotosText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  // Reviews
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avgRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avgRatingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.warm,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  reviewUsername: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewComment: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  reviewDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  noReviewsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight + '15',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.sm,
    minHeight: SPACING.xxl,
  },
  addReviewText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
});
