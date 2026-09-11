import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, List, User } from 'lucide-react-native';
import { Frost } from './GlassSurface';
import { radius, spacing, typography, shadows } from '../constants/theme';
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
  const insets = useSafeAreaInsets();
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
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={({ pressed }) => [styles.tabItem, isFocused && styles.tabActive, pressed && { opacity: 0.65 }]}
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <Icon
              size={22}
              strokeWidth={1.8}
              color={isFocused ? '#514582' : '#62677E'}
            />
            <Text style={[styles.tabLabel, { color: isFocused ? '#514582' : '#62677E' }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (isWeb) {
    return <View style={styles.barWeb}><Frost />{content}</View>;
  }

  return (
    <View style={[styles.barNative, { bottom: Math.max(insets.bottom, spacing.md) }]}>
      <Frost />{content}
    </View>
  );
}

const styles = StyleSheet.create({
  barWeb: {
    overflow: 'hidden',
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.76)',
    backdropFilter: 'blur(20px) saturate(150%)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
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
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
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
  tabActive: {
    backgroundColor: 'rgba(218,207,248,0.72)',
  },
  tabItem: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
