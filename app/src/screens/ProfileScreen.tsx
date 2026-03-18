import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useProgressStore } from '@/stores/progressStore';
import { useAvatar } from '@/hooks/useAvatar';
import { useCreatePost } from '@/hooks/useFeed';
import IslandProgressMap from '@/components/IslandProgressMap';
import type { ProfileStackParamList } from '@/navigation/types';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, signOut } = useAuth();
  const {
    totalCompleted,
    totalTrails,
    overallProgress,
    zoneProgress,
    isLoading,
    loadProgress,
  } = useProgressStore();

  const { avatarUrl, isUploading, pickAndUpload } = useAvatar(user?.id);

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
    }
  }, [user?.id, loadProgress]);

  const createPost = useCreatePost();

  const handleShareProgress = () => {
    if (!user?.id) return;
    const pct = Math.round(overallProgress * 100);
    createPost.mutate({
      user_id: user.id,
      content: `J'ai explore ${pct}% de La Reunion ! (${totalCompleted}/${totalTrails} sentiers)`,
      post_type: 'achievement',
      stats: { completed: totalCompleted, total: totalTrails, progress: pct, zones: completedZones },
      visibility: 'public',
    });
  };

  const completedZones = zoneProgress.filter((z) => z.progress >= 1).length;
  const totalZones = zoneProgress.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User info */}
      <View style={styles.userSection}>
        <Pressable onPress={pickAndUpload} style={styles.avatarContainer} accessibilityLabel="Changer la photo de profil">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={COLORS.textPrimary} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="camera" size={14} color={COLORS.white} />
            )}
          </View>
        </Pressable>
        <Text style={styles.username}>
          {user?.user_metadata?.username ?? user?.email ?? 'Randonneur'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Island progress map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ta carte de La Reunion</Text>
        <IslandProgressMap height={250} />
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="trail-sign"
          value={`${totalCompleted}/${totalTrails}`}
          label="Sentiers"
          color={COLORS.primary}
        />
        <StatCard
          icon="map"
          value={`${completedZones}/${totalZones}`}
          label="Zones"
          color="#3B82F6"
        />
        <StatCard
          icon="trophy"
          value={`${Math.round(overallProgress * 100)}%`}
          label="Progression"
          color="#F59E0B"
        />
      </View>

      {/* Zone breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression par zone</Text>
        {zoneProgress
          .filter((z) => z.totalTrails > 0)
          .sort((a, b) => b.progress - a.progress)
          .map((zone) => (
            <View key={zone.zoneSlug} style={styles.zoneRow}>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.zoneName}</Text>
                <Text style={styles.zoneCount}>
                  {zone.completedTrails}/{zone.totalTrails}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(zone.progress * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
      </View>

      {/* Share progress */}
      <Pressable
        style={styles.shareButton}
        onPress={handleShareProgress}
        disabled={createPost.isPending}
        accessibilityLabel="Partager ma progression"
      >
        <Ionicons name="share-social" size={18} color={COLORS.white} />
        <Text style={styles.shareText}>
          {createPost.isPending ? 'Publication...' : 'Partager ma progression'}
        </Text>
      </Pressable>

      {/* Social buttons */}
      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialButton}
          onPress={() => navigation.navigate('Feed')}
          accessibilityLabel="Voir le feed communaute"
        >
          <Ionicons name="newspaper-outline" size={20} color={COLORS.primary} />
          <Text style={styles.socialButtonText}>Communaute</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </Pressable>
        <Pressable
          style={styles.socialButton}
          onPress={() => navigation.navigate('Friends')}
          accessibilityLabel="Voir mes amis"
        >
          <Ionicons name="people-outline" size={20} color={COLORS.primary} />
          <Text style={styles.socialButtonText}>Mes amis</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Settings */}
      <Pressable
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.settingsText}>Parametres</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </Pressable>

      {/* Sign out */}
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text style={styles.signOutText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  username: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
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
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    gap: 4,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  zoneRow: {
    marginBottom: SPACING.md,
  },
  zoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  zoneName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  zoneCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primary,
  },
  shareText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  socialRow: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  socialButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  settingsText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  signOutText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: '600',
  },
});
