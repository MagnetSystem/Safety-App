import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step1Valid = name.trim().length > 1 && email.trim().length > 0 && password.length >= 8;
  const canSubmit = step1Valid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        joinCode: joinCode.trim() || undefined,
      });
      router.replace('/(auth)/complete-profile' as any);
    } catch (err: any) {
      setError(err.message ?? 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Create account"
          subtitle={step === 1 ? 'Step 1: Your details' : 'Step 2: Organization (optional)'}
          back={step === 1 ? '/(auth)/login' : undefined}
          onBack={step === 2 ? () => setStep(1) : undefined}
        />

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, step >= 1 ? styles.progressActive : {}]} />
          <View style={[styles.progressBar, step >= 2 ? styles.progressActive : {}]} />
        </View>

        <View style={styles.form}>
          {step === 1 && (
            <>
              <GlassInput label="Full name" placeholder="Aarav Mehta" value={name} onChangeText={setName} />
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
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Pressable
                style={[styles.button, !step1Valid && styles.buttonDisabled]}
                onPress={() => step1Valid && setStep(2)}
                disabled={!step1Valid}
              >
                <Text style={styles.buttonText}>Next</Text>
                <ChevronRight size={20} color="#FFF" />
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <GlassInput
                label="Organization join code (optional)"
                placeholder="e.g. DEMOJOIN"
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                autoCapitalize="characters"
              />
              <Text style={styles.noticeText}>
                Ask your owner or admin for the join code. Skip this if you only need Emergency SOS and a Guardian — you can join later from Profile.
              </Text>

              {error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, styles.backButton]}
                  onPress={() => setStep(1)}
                  disabled={submitting}
                >
                  <ChevronLeft size={20} color={colors.indigoink} />
                  <Text style={[styles.buttonText, { color: colors.indigoink }]}>Back</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.submitButton, !canSubmit && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create account</Text>
                      <Check size={20} color="#FFF" />
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    paddingHorizontal: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: colors.indigoink,
  },
  form: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  noticeText: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.indigoink,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.soft,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    flex: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
