import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows, typography, spacing } from '../constants/theme';

export function PhoneFrame({ children, isEmergency = false }: { children: React.ReactNode, isEmergency?: boolean }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const showFrame = isWeb && width > 480;

  if (!showFrame) {
    return <View style={styles.fullScreen}>{children}</View>;
  }

  const bgColors = isEmergency ? gradients.coral : gradients.appBackground;
  const bgLocations = isEmergency ? gradients.coralLocations : gradients.appBackgroundLocations;

  return (
    <View style={styles.webContainer}>
      <LinearGradient
        colors={gradients.appBackground}
        locations={gradients.appBackgroundLocations}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.frameWrapper}>
        <View style={styles.phoneFrame}>
          {children}
        </View>
        <Text style={styles.caption}>
          Campus Safety — visual preview with sample data
        </Text>
      </View>
    </View>
  );
}

export function Screen({ children, padded = true, style, isEmergency = false }: { children: React.ReactNode, padded?: boolean, style?: any, isEmergency?: boolean }) {
  const bgColors = isEmergency ? gradients.coral : gradients.appBackground;
  const bgLocations = isEmergency ? gradients.coralLocations : gradients.appBackgroundLocations;

  return (
    <LinearGradient
      colors={bgColors}
      locations={bgLocations}
      style={[styles.screen, padded && styles.screenPadded, style]}
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
