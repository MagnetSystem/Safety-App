import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UploadCloud } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, GlassInput } from '../../src/components/ui-kit';
import { CATEGORY_OPTIONS, categoryLabel, type IncidentCategoryEnum } from '../../src/types';
import { createComplaint } from '../../src/services/complaintsService';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';

export default function NewReportScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'normal' | 'anonymous' }>();
  const isAnonymous = mode === 'anonymous';
  const [category, setCategory] = useState<IncidentCategoryEnum>(CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const accentText = isAnonymous ? colors.lavender : colors.mintInk;
  const accentBg = isAnonymous ? colors.lavenderTint : colors.mintTint;
  const submitBg = isAnonymous ? colors.lavender : colors.mint;

  const canSubmit = description.trim().length >= 3 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await createComplaint({
        type: isAnonymous ? 'ANONYMOUS' : 'NORMAL',
        category,
        description: description.trim(),
        location: location.trim() || undefined,
      });
      router.replace('/(tabs)/reports');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title={isAnonymous ? 'Anonymous report' : 'Normal report'}
          subtitle={
            isAnonymous
              ? 'Your name is never attached to this report'
              : 'Filed with your name so the committee can follow up'
          }
          back="/(tabs)/home"
        />

        <View style={[styles.identityPill, { backgroundColor: accentBg }]}>
          <Text style={[styles.identityText, { color: accentText }]}>
            {isAnonymous ? 'Identity hidden' : 'Identity shared'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Glass style={styles.categoryCard}>
            <Text style={styles.label}>What kind of incident was it?</Text>
            <View style={styles.chipsContainer}>
              {CATEGORY_OPTIONS.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.chip,
                      active ? { backgroundColor: accentBg } : styles.chipInactive
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active ? { color: accentText, fontFamily: 'Inter_500Medium' } : styles.chipTextInactive
                      ]}
                    >
                      {categoryLabel(c)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Glass>

          <GlassInput
            label="Tell us what happened"
            placeholder="Take your time. Write it the way you remember it — who was involved, what they did, and when."
            multiline
            numberOfLines={5}
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
          />

          <GlassInput
            label="Where did it happen?"
            placeholder="Hostel B-block, 2nd floor corridor"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.evidenceContainer}>
            <Text style={styles.label}>Evidence (optional)</Text>
            <Pressable style={styles.dropzone} disabled>
              <UploadCloud size={22} strokeWidth={1.7} color={accentText} />
              <Text style={styles.dropzoneTitle}>Add photos, screenshots or audio</Text>
              <Text style={styles.dropzoneSubtitle}>Coming soon</Text>
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.submitButton, { backgroundColor: submitBg }, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit report</Text>}
          </Pressable>
          <Text style={styles.footnote}>
            The anti-ragging committee usually responds within 24 hours.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  identityPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  identityText: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
  },
  formContainer: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  categoryCard: {
    paddingVertical: spacing.md,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.md,
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
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  chipText: {
    ...typography.caption,
  },
  chipTextInactive: {
    color: colors.subink,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  evidenceContainer: {},
  dropzone: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 28,
    opacity: 0.6,
  },
  dropzoneTitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
  },
  dropzoneSubtitle: {
    ...typography.caption,
    color: colors.mutedink,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  footnote: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    lineHeight: 18,
  },
});
