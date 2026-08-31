import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, List, User } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const icons = {
  home: Home,
  reports: List,
  profile: User,
};

const labels = {
  home: 'Home',
  reports: 'My reports',
  profile: 'Profile',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const isWeb = Platform.OS === 'web';

  const content = (
    <View style={styles.content}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const Icon = icons[route.name as keyof typeof icons];
        const label = labels[route.name as keyof typeof labels] || route.name;

        if (!Icon) return null; // Skip if no icon mapping

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <Icon
              size={22}
              strokeWidth={1.8}
              color={isFocused ? colors.indigoink : colors.mutedink}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? colors.indigoink : colors.mutedink }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (isWeb) {
    return <View style={styles.barWeb}>{content}</View>;
  }

  return (
    <View style={styles.barNative}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  barWeb: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    backdropFilter: 'blur(20px) saturate(150%)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.tabBar,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px -18px rgba(34, 35, 42, 0.25)',
      } as any,
    }),
  },
  barNative: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: radius.tabBar,
    overflow: 'hidden',
    ...shadows.soft,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 0 : spacing.md,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
  },
});
