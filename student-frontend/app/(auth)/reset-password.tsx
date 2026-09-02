import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { resetPassword } from '../../src/services/authService';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!token && password.length >= 8 && password === confirm && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title="Set a new password" back="/(auth)/login" />

        {!token ? (
          <Text style={styles.error}>
            This screen opens from the reset link in your email. Request one from the sign-in screen.
          </Text>
        ) : done ? (
          <View style={styles.doneBox}>
            <ShieldCheck size={40} strokeWidth={1.5} color={colors.mintInk} />
            <Text style={styles.doneText}>Your password has been updated.</Text>
            <Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.buttonText}>Sign in</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <GlassInput
              label="New password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <GlassInput
              label="Confirm password"
              placeholder="Re-enter password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              style={[styles.button, !canSubmit && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Update password</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  form: { marginTop: spacing.xl, gap: spacing.lg },
  button: {
    backgroundColor: colors.indigoink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#FFFFFF' },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  doneBox: { marginTop: spacing.xxl, alignItems: 'center', gap: spacing.md },
  doneText: { ...typography.body, fontSize: 15, color: colors.ink },
});
