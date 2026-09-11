import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, TextInputProps, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, HeartHandshake } from 'lucide-react-native';
import { Frost } from './GlassSurface';
import { glassSurface, colors, radius, typography, spacing, shadows } from '../constants/theme';
import { ComplaintStatus, statusLabel } from '../types';

export function Glass({ children, style }: { children: React.ReactNode, style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.glassWeb, style]}><Frost />{children}</View>;
}

export function LoadingCards() {
  return <View accessibilityLabel="Loading content" accessibilityRole="progressbar" style={{ gap: 12 }}>
    {[0, 1, 2].map(i => <View key={i} style={{ padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', gap: 12 }}>
      <View style={{ width: '55%', height: 16, borderRadius: 8, backgroundColor: '#E4EEEB' }} />
      <View style={{ width: '80%', height: 12, borderRadius: 6, backgroundColor: '#EDF3F1' }} />
    </View>)}
  </View>;
}

export function EmptyState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <Glass style={{ alignItems: 'center', padding: 24, gap: 12 }}>
    <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' }}><HeartHandshake size={28} color={colors.mintInk} /></View>
    <Text style={{ ...typography.h3, color: colors.ink, textAlign: 'center' }}>{title}</Text>
    <Text style={{ ...typography.body, color: colors.subink, textAlign: 'center' }}>{message}</Text>
    {onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, borderRadius: 14, backgroundColor: colors.mintTint }}><Text style={{ ...typography.label, color: colors.mintInk }}>Try again</Text></Pressable>}
  </Glass>;
}

export function StatusPill({ status }: { status: ComplaintStatus }) {
  const isResolved = status === 'RESOLVED';
  const isClosed = status === 'CLOSED';
  const needsInfo = status === 'MORE_INFO_REQUESTED';
  const bg = isResolved ? colors.mintTint : isClosed ? colors.neutralTint : needsInfo ? colors.amberTint : colors.lavenderTint;
  const color = isResolved ? colors.mintInk : isClosed ? colors.neutralInk : needsInfo ? colors.amberInk : colors.lavender;

  return (
    <View style={[styles.statusPill, { backgroundColor: bg, maxWidth: '100%' }]}>
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
          accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}
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
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          {...props}
          style={[styles.glassInputWeb, isFocused && styles.glassInputFocused, style] as any}
          accessibilityLabel={props.accessibilityLabel ?? label}
          onFocus={(event) => { setIsFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setIsFocused(false); props.onBlur?.(event); }}
          placeholderTextColor={colors.mutedink}
        />
      ) : (
        <View style={[styles.glassInputNative, isFocused && styles.glassInputFocused]}>
          <Frost />

          <TextInput
            {...props}
            style={[styles.nativeInput, style] as any}
            accessibilityLabel={props.accessibilityLabel ?? label}
          onFocus={(event) => { setIsFocused(true); props.onFocus?.(event); }}
            onBlur={(event) => { setIsFocused(false); props.onBlur?.(event); }}
            placeholderTextColor={colors.mutedink}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glassWeb: {
    ...glassSurface,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.card,
    padding: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 28px -14px rgba(102, 93, 154, 0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
      } as any,
    }),
  },
  glassNative: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
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
    flexShrink: 1,
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
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingRight: 16,
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
    minHeight: 52,
    backgroundColor: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 16,
    color: colors.ink,
    outlineStyle: 'none',
  } as any,
  glassInputNative: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.input,
    overflow: 'hidden',
  },
  glassInputFocused: {
    borderColor: colors.mint,
  },
  nativeInput: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 16,
    color: colors.ink,
  },
});
