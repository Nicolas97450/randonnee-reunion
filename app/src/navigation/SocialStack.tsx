import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { SocialStackParamList } from './types';
import InboxScreen from '@/screens/InboxScreen';
import ConversationScreen from '@/screens/ConversationScreen';
import FriendsScreen from '@/screens/FriendsScreen';
import FeedScreen from '@/screens/FeedScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests } from '@/hooks/useFriends';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

const Stack = createNativeStackNavigator<SocialStackParamList>();

function InboxHeaderRight() {
  const { user } = useAuth();
  const { data: pending = [] } = useFriendRequests(user?.id);

  return (
    <View style={headerStyles.row}>
      <Pressable
        onPress={() => {
          // Navigate to Friends — handled via navigation in the screen
        }}
        style={headerStyles.iconButton}
        accessibilityLabel="Mes amis"
      >
        <Ionicons name="people" size={22} color={COLORS.textPrimary} />
        {pending.length > 0 && (
          <View style={headerStyles.badge}>
            <Text style={headerStyles.badgeText}>{pending.length}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.sm, marginRight: SPACING.xs },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
});

export default function SocialStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={({ navigation }) => ({
          title: 'Messages',
          headerRight: () => (
            <View style={headerStyles.row}>
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                style={headerStyles.iconButton}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications" size={22} color={COLORS.textPrimary} />
                <NotificationBellBadge />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Feed')}
                style={headerStyles.iconButton}
                accessibilityLabel="Communaute"
              >
                <Ionicons name="newspaper" size={22} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Friends')}
                style={headerStyles.iconButton}
                accessibilityLabel="Mes amis"
              >
                <Ionicons name="people" size={22} color={COLORS.textPrimary} />
                <InboxFriendBadge />
              </Pressable>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={({ route }) => ({ title: route.params.peerUsername ?? 'Message' })}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Mes amis' }}
      />
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: 'Communaute' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({ title: route.params.username ?? 'Profil' })}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}

function InboxFriendBadge() {
  const { user } = useAuth();
  const { data: pending = [] } = useFriendRequests(user?.id);
  if (pending.length === 0) return null;
  return (
    <View style={headerStyles.badge}>
      <Text style={headerStyles.badgeText}>{pending.length}</Text>
    </View>
  );
}

function NotificationBellBadge() {
  const { unreadCount } = useInAppNotifications();
  if (unreadCount <= 0) return null;
  return (
    <View style={headerStyles.badge}>
      <Text style={headerStyles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
    </View>
  );
}
