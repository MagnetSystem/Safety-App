import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { forgotPassword } from '../../src/services/authService';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (email.trim().length < 3 || submitting) return;
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message);
    } catch {
      setMessage('If that email has an account, a reset link is on its way.');
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Forgot password"
          subtitle="We'll email you a link to set a new one."
          back="/(auth)/login"
        />

        {sent ? (
          <View style={styles.doneBox}>
            <MailCheck size={40} strokeWidth={1.5} color={colors.mintInk} />
            <Text style={styles.doneText}>{message}</Text>
            <Text style={styles.doneHint}>
              Open the link on this device — it will bring you back into the app to choose a new password.
            </Text>
            <Pressable style={styles.linkBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.linkText}>Back to sign in</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <GlassInput
              label="Email"
              placeholder="you@college.edu"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable
              style={[styles.button, (email.trim().length < 3 || submitting) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={email.trim().length < 3 || submitting}
            >
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send reset link</Text>}
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
  doneBox: { marginTop: spacing.xxl, alignItems: 'center', gap: spacing.md },
  doneText: {
    ...typography.body,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneHint: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  linkBtn: { marginTop: spacing.lg },
  linkText: { ...typography.body, fontSize: 14, color: colors.indigoink },
});
