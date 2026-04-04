import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

export type TabKey = 'infos' | 'avis' | 'photos';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TrailTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TAB_CONFIG: TabConfig[] = [
  { key: 'infos', label: 'Infos', icon: 'information-circle-outline' },
  { key: 'avis', label: 'Avis', icon: 'chatbubbles-outline' },
  { key: 'photos', label: 'Photos', icon: 'images-outline' },
];

export default function TrailTabBar({ activeTab, onTabChange }: TrailTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {TAB_CONFIG.map((tab) => (
        <Pressable
          key={tab.key}
          style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
          onPress={() => onTabChange(tab.key)}
          accessibilityLabel={`Onglet ${tab.label}`}
        >
          <Ionicons
            name={tab.icon}
            size={18}
            color={activeTab === tab.key ? COLORS.primaryLight : COLORS.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    minHeight: SPACING.xxl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primaryLight,
  },
  tabLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
});
