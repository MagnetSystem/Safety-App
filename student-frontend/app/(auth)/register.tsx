import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Glass, GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { getPublicColleges, PublicCollege } from '../../src/services/collegesService';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<PublicCollege[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [mobile, setMobile] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPublicColleges()
      .then((list) => {
        setColleges(list);
        if (list.length > 0) setCollegeId(list[0].id);
      })
      .catch(() => setError('Could not load the list of colleges. Pull down to try again.'))
      .finally(() => setCollegesLoading(false));
  }, []);

  const step1Valid = name.trim().length > 1 && email.trim().length > 0 && password.length >= 8;
  const step2Valid = !!collegeId;
  const canSubmit = step1Valid && step2Valid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !collegeId) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        collegeId,
        studentNumber: studentNumber.trim() || undefined,
        mobile: mobile.trim() || undefined,
      });
      router.replace('/(tabs)/home');
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
          subtitle={step === 1 ? "Step 1: Your details" : "Step 2: College info"}
          back={step === 1 ? "/(auth)/login" : undefined}
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
                placeholder="you@college.edu"
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
                label="Roll / registration number (optional)"
                placeholder="SIT/CSE/2029/0147"
                value={studentNumber}
                onChangeText={setStudentNumber}
              />
              <GlassInput
                label="Mobile (optional)"
                placeholder="+91 90000 00000"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />

              <View>
                <Text style={styles.label}>Select your College</Text>
                {collegesLoading ? (
                  <ActivityIndicator color={colors.indigoink} style={styles.collegeLoading} />
                ) : (
                  <View style={styles.chipsContainer}>
                    {colleges.map((c) => {
                      const active = c.id === collegeId;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setCollegeId(c.id)}
                          style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                            {c.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {colleges.length === 0 && (
                      <Text style={styles.emptyColleges}>No colleges are registered yet.</Text>
                    )}
                  </View>
                )}
              </View>

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
                      <Text style={styles.buttonText}>Create</Text>
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
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.md,
  },
  collegeLoading: {
    marginTop: spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  chipActive: {
    backgroundColor: colors.lavenderTint,
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  chipText: {
    ...typography.caption,
    color: colors.subink,
  },
  chipTextActive: {
    color: colors.lavender,
    fontFamily: 'Inter_500Medium',
  },
  emptyColleges: {
    ...typography.caption,
    color: colors.mutedink,
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
