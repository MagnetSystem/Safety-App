import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { getPendingGuardianCode } from '../../src/services/pendingGuardianCode';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const params = useLocalSearchParams<{ purpose?: string }>();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  // Explicit choice — inferring "guardian" from "no organization yet" was wrong, since a real
  // member who just hasn't joined an org yet would get incorrectly treated as guardian-only.
  // Arriving here from a guardian-invite deep link (?purpose=guardian) is itself an explicit
  // signal, so it pre-selects Guardian instead of defaulting to Member and hoping they notice.
  const [purpose, setPurpose] = useState<'member' | 'guardian'>(params.purpose === 'guardian' ? 'guardian' : 'member');
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
        joinCode: purpose === 'member' ? joinCode.trim() || undefined : undefined,
        accountPurpose: purpose,
      });
      const pendingGuardianCode = await getPendingGuardianCode();
      if (pendingGuardianCode) {
        router.replace(`/guardian/accept?code=${encodeURIComponent(pendingGuardianCode)}` as any);
        return;
      }
      router.replace('/(auth)/complete-profile' as any); // complete-profile itself routes onward via '/' once done
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
          subtitle={step === 1 ? 'Step 1: Your details' : 'Step 2: Member or Guardian'}
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
              <Text style={styles.label}>Are you joining as a Member or a Guardian?</Text>
              <View style={styles.purposeRow}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: purpose === 'member' }}
                  onPress={() => setPurpose('member')}
                  style={[styles.purposeCard, purpose === 'member' && styles.purposeCardActive]}
                >
                  <Text style={[styles.purposeTitle, purpose === 'member' && styles.purposeTitleActive]}>Member</Text>
                  <Text style={styles.purposeDesc}>You'll report incidents and can trigger Emergency SOS.</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: purpose === 'guardian' }}
                  onPress={() => setPurpose('guardian')}
                  style={[styles.purposeCard, purpose === 'guardian' && styles.purposeCardActive]}
                >
                  <Text style={[styles.purposeTitle, purpose === 'guardian' && styles.purposeTitleActive]}>Guardian</Text>
                  <Text style={styles.purposeDesc}>You'll watch over someone else's emergency alerts only.</Text>
                </Pressable>
              </View>

              {purpose === 'member' ? (
                <>
                  <GlassInput
                    label="Organization join code (optional)"
                    placeholder="e.g. DEMOJOIN"
                    value={joinCode}
                    onChangeText={(t) => setJoinCode(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                  <Text style={styles.noticeText}>
                    Ask your owner or admin for the join code. You can also join later from Profile.
                  </Text>
                </>
              ) : (
                <Text style={styles.noticeText}>
                  You'll accept a guardian invite code right after this (or anytime later from Profile → Guardian).
                </Text>
              )}

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
  label: {
    ...typography.body,
    fontSize: 15,
    color: colors.ink,
  },
  purposeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  purposeCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.6)',
    gap: 4,
  },
  purposeCardActive: {
    borderColor: colors.indigoink,
    backgroundColor: 'rgba(91,110,232,0.08)',
  },
  purposeTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.ink,
  },
  purposeTitleActive: {
    color: colors.indigoink,
  },
  purposeDesc: {
    ...typography.caption,
    color: colors.subink,
    lineHeight: 16,
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
