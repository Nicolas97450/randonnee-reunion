import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import type { FriendStory } from '@/hooks/useFriendStories';

interface StoryItemProps {
  story: FriendStory;
  onPress: (userId: string, username: string | null) => void;
}

const StoryItem = React.memo(function StoryItem({ story, onPress }: StoryItemProps) {
  const borderColor = story.is_recent ? COLORS.primaryLight : COLORS.textMuted;
  const displayName = story.username?.trim() || 'Ami';

  return (
    <Pressable
      style={styles.storyItem}
      onPress={() => onPress(story.user_id, story.username)}
      accessibilityLabel={`Voir le profil de ${displayName}`}
    >
      <View style={[styles.storyAvatarBorder, { borderColor }]}>
        {story.avatar_url ? (
          <Image source={{ uri: story.avatar_url }} style={styles.storyAvatar} />
        ) : (
          <View style={styles.storyAvatarPlaceholder}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {displayName}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyAvatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyAvatar: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
  },
  storyAvatarPlaceholder: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
    maxWidth: 68,
  },
});

export default StoryItem;
