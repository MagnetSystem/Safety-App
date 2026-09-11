import React, { useRef } from 'react';
import { BlurTargetView } from 'expo-blur';
import { GlassBackground } from './GlassSurface';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows, typography, spacing } from '../constants/theme';

function AmbientFrame({ children, framed = false }: { children: React.ReactNode; framed?: boolean }) {
  const target = useRef<View | null>(null);
  return <GlassBackground.Provider value={target}>
    <View style={framed ? styles.phoneFrame : styles.fullScreen}>
      <BlurTargetView ref={target} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={gradients.appBackground} locations={gradients.appBackgroundLocations} style={StyleSheet.absoluteFill} />
      </BlurTargetView>
      {children}
    </View>
  </GlassBackground.Provider>;
}

export function PhoneFrame({ children }: { children: React.ReactNode, isEmergency?: boolean }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const showFrame = isWeb && width > 480;

  if (!showFrame) {
    return <AmbientFrame>{children}</AmbientFrame>;
  }

  return (
    <View style={styles.webContainer}>
      <LinearGradient
        colors={gradients.appBackground}
        locations={gradients.appBackgroundLocations}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.frameWrapper}>
        <AmbientFrame framed>{children}</AmbientFrame>
        <Text style={styles.caption}>
          Your safety, within reach
        </Text>
      </View>
    </View>
  );
}

export function Screen({ children, padded = true, style, isEmergency = false }: { children: React.ReactNode, padded?: boolean, style?: any, isEmergency?: boolean }) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const hasTabs = segments[0] === '(tabs)';
  const bgColors = isEmergency ? gradients.coral : gradients.appBackground;
  const bgLocations = isEmergency ? gradients.coralLocations : gradients.appBackgroundLocations;

  return (
    <LinearGradient
      colors={bgColors}
      locations={bgLocations}
      style={[styles.screen, padded && styles.screenPadded, padded && { paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: (hasTabs ? 100 : 20) + insets.bottom }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  frameWrapper: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    minHeight: 720,
    height: '90vh',
    maxHeight: 850,
    borderRadius: radius.phoneFrame,
    borderWidth: 1,
    borderColor: colors.frame,
    overflow: 'hidden',
    position: 'relative',
    // Web specific shadow
    ...Platform.select({
      web: {
        boxShadow: '0 30px 70px -30px rgba(91, 110, 232, 0.35)',
      } as any,
      default: shadows.phone,
    }),
  },
  caption: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  screen: {
    flex: 1,
  },
  screenPadded: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: 112, // Clears tab bar
  },
});
