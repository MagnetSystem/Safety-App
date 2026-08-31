import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, TextInputProps, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radius, typography, spacing, shadows } from '../constants/theme';
import { ComplaintStatus, statusLabel } from '../types';

export function Glass({ children, style }: { children: React.ReactNode, style?: ViewStyle | ViewStyle[] }) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.glassWeb, style]}>
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={20} tint="light" style={[styles.glassNative, style]}>
      {children}
    </BlurView>
  );
}

export function StatusPill({ status }: { status: ComplaintStatus }) {
  const isResolved = status === 'RESOLVED';
  const isClosed = status === 'CLOSED';
  const bg = isResolved ? colors.mintTint : isClosed ? colors.neutralTint : colors.amberTint;
  const color = isResolved ? colors.mintInk : isClosed ? colors.neutralInk : colors.amberInk;

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <Text style={[styles.statusText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function ScreenHeader({ title, subtitle, back, onBack }: { title: string, subtitle?: string, back?: string, onBack?: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      {(back || onBack) && (
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (onBack) return onBack();
            if (router.canGoBack()) return router.back();
            if (back) router.replace(back as any);
          }}
        >
          <ChevronLeft size={16} color={colors.indigoink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function GlassInput({ label, style, ...props }: { label: string, style?: any } & TextInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          {...props}
          style={[styles.glassInputWeb, isFocused && styles.glassInputFocused, style] as any}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.mutedink}
        />
      ) : (
        <View style={[styles.glassInputNative, isFocused && styles.glassInputFocused]}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          <TextInput
            {...props}
            style={[styles.nativeInput, style] as any}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor={colors.mutedink}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glassWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(20px) saturate(140%)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.card,
    padding: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px -18px rgba(34, 35, 42, 0.25)',
      } as any,
    }),
  },
  glassNative: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.card,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.soft,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
  },
  headerContainer: {
    marginBottom: spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.body,
    fontSize: 14,
    color: colors.indigoink,
    marginLeft: 4,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.subink,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.sm,
  },
  glassInputWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 15,
    color: colors.ink,
    outlineStyle: 'none',
  } as any,
  glassInputNative: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.input,
    overflow: 'hidden',
  },
  glassInputFocused: {
    borderColor: 'rgba(91, 110, 232, 0.5)',
  },
  nativeInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 15,
    color: colors.ink,
  },
});
