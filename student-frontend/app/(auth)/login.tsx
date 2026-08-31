import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Glass, GlassInput } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';
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
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message ?? 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Glass style={styles.iconWrapper}>
            <ShieldCheck size={34} strokeWidth={1.6} color={colors.indigoink} />
          </Glass>
          <Text style={styles.title}>Campus Safety</Text>
          <Text style={styles.subtitle}>
            You are not alone. Report ragging safely, anonymously if you want, and we will take it from there.
          </Text>
        </View>

        <View style={styles.form}>
          <GlassInput
            label="Email"
            placeholder="you@college.edu"
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
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Your details stay private. Anonymous reports never show your name to anyone on the committee.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    fontSize: 30,
    color: colors.ink,
    marginTop: 24,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 260,
  },
  form: {
    marginTop: 40,
    gap: spacing.lg,
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
    marginTop: 32,
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
  footnote: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
