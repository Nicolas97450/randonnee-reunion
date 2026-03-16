import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useProgressStore } from '@/stores/progressStore';
import IslandProgressMap from '@/components/IslandProgressMap';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const {
    totalCompleted,
    totalTrails,
    overallProgress,
    zoneProgress,
    isLoading,
    loadProgress,
  } = useProgressStore();

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
    }
  }, [user?.id, loadProgress]);

  const completedZones = zoneProgress.filter((z) => z.progress >= 1).length;
  const totalZones = zoneProgress.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={COLORS.textPrimary} />
        </View>
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
