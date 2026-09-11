import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { getMyProfile } from '../../src/services/membersService';
import { Glass, GlassInput } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      try {
        const profile = await getMyProfile();
        const isProfileIncomplete = !profile.mobile || !profile.studentNumber || !profile.department || !profile.emergencyContactName || !profile.emergencyContactPhone;
        if (isProfileIncomplete) {
          router.replace('/(auth)/complete-profile' as any);
        } else {
          router.replace('/(tabs)/home');
        }
      } catch {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message ?? 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Glass style={styles.header}>
          <View style={styles.brand}><ShieldCheck size={22} color={colors.mintInk} /><Text style={styles.brandText}>SAFETY PLATFORM</Text></View>
          <View pointerEvents="none" style={styles.orbit} />
          <Text style={styles.title}>Your space.{'\n'}Your support.</Text>
          <Text style={styles.subtitle}>A trusted circle, a way to speak up, and help within reach.</Text>
          <View style={styles.tag}><Text style={styles.tagText}>Here for your everyday</Text></View>
        </Glass>
        <Text style={styles.welcome}>Welcome back</Text>

        <View style={styles.form}>
          <GlassInput
            label="Email"
            placeholder="you@organization.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <GlassInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          accessibilityRole="button"
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>

        <Pressable accessibilityRole="button" style={{ minHeight: 48, justifyContent: 'center' }} onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>

        <Pressable accessibilityRole="button" style={{ minHeight: 48, justifyContent: 'center' }} onPress={() => router.push('/(auth)/forgot-password' as any)}>
          <Text style={styles.forgotText}>Forgot your password?</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Choose a named or anonymous report. Review what you share before sending.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: { borderRadius: 32, padding: 26, overflow: 'hidden', gap: 18 },
  brand: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  brandText: { ...typography.label, fontSize: 11, color: colors.mintInk, letterSpacing: 1.5 },
  orbit: { position: 'absolute', right: -85, top: 30, width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  title: { ...typography.h1, fontSize: 37, color: colors.ink, lineHeight: 43 },
  subtitle: { ...typography.body, fontSize: 15, color: colors.subink, maxWidth: 255 },
  tag: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(213,242,228,0.8)' },
  tagText: { ...typography.caption, color: '#244A3A' },
  welcome: { ...typography.h2, color: colors.ink, marginTop: 28 },
  form: {
    marginTop: 20,
    gap: 4,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.indigoink,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
    ...shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  linkText: {
    ...typography.body,
    fontSize: 13,
    color: colors.indigoink,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  forgotText: {
    ...typography.caption,
    color: colors.subink,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footnote: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
