import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { ImagePlus, Paperclip, X, FileText } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, GlassInput } from '../../src/components/ui-kit';
import { CATEGORY_OPTIONS, categoryLabel, type IncidentCategoryEnum } from '../../src/types';
import { createComplaint } from '../../src/services/incidentsService';
import {
  uploadAllEvidence,
  evidenceTypeFromMime,
  type LocalAttachment,
} from '../../src/services/evidenceService';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export default function NewReportScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'normal' | 'anonymous' }>();
  const isAnonymous = mode === 'anonymous';
  const scroll = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);
  const goToStep = (next: number) => { setStep(next); setError(null); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const [category, setCategory] = useState<IncidentCategoryEnum>(CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  const accentText = isAnonymous ? colors.lavender : colors.mintInk;
  const accentBg = isAnonymous ? colors.lavenderTint : colors.mintTint;
  const submitBg = isAnonymous ? colors.lavender : colors.mint;

  const canSubmit = description.trim().length >= 3 && !submitting;
  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  const addAttachment = (att: LocalAttachment) => {
    if (att.size && att.size > MAX_FILE_BYTES) {
      Alert.alert('File too large', 'Each attachment must be under 25 MB.');
      return;
    }
    setAttachments((prev) => [...prev, att]);
  };

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    addAttachment({
      uri: asset.uri,
      name: asset.fileName ?? `evidence-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      size: asset.fileSize,
      type: asset.type === 'video' ? 'VIDEO' : 'IMAGE',
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    addAttachment({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
      type: evidenceTypeFromMime(asset.mimeType),
    });
  };

  const removeAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((a) => a.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    let gps: { gpsLat?: number; gpsLng?: number; gpsAccuracy?: number } = {};
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        gps = {
          gpsLat: position.coords.latitude,
          gpsLng: position.coords.longitude,
          gpsAccuracy: position.coords.accuracy ?? undefined,
        };
      }
    } catch {
      // Proceed without GPS if error
    }

    try {
      const complaint = await createComplaint({
        type: isAnonymous ? 'ANONYMOUS' : 'NORMAL',
        category,
        description: description.trim(),
        location: location.trim() || undefined,
        ...gps,
      });

      if (attachments.length > 0) {
        setUploadNote(`Uploading ${attachments.length} file${attachments.length > 1 ? 's' : ''}…`);
        const { uploaded, failed } = await uploadAllEvidence(complaint.id, attachments);
        if (failed > 0) {
          Alert.alert(
            'Report submitted',
            `Your report was filed, but ${failed} of ${uploaded + failed} attachments failed to upload. You can add them again from the report later.`,
          );
        }
      }

      router.replace('/(tabs)/reports');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadNote(null);
    }
  };

  return (
    <Screen padded>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title={isAnonymous ? 'Anonymous report' : 'Report an issue'}
          subtitle={
            isAnonymous
              ? 'Your identity is hidden in anonymous reporting'
              : 'Filed with your name so the committee can follow up'
          }
          back="/(tabs)/home"
          onBack={step > 0 ? () => goToStep(step - 1) : undefined}
        />

        <View accessibilityLabel={`Step ${step + 1} of 3`} style={styles.steps}>
          {['Incident', 'Details', 'Review'].map((label, index) => <View key={label} style={styles.stepItem}><View style={[styles.stepNumber, index <= step && { backgroundColor: colors.mint }]}><Text style={{ ...typography.label, color: index <= step ? '#FFFFFF' : colors.subink }}>{index + 1}</Text></View><Text style={{ ...typography.label, color: index === step ? colors.mintInk : colors.subink }}>{label}</Text></View>)}
        </View>
        <View style={[styles.identityPill, { backgroundColor: accentBg }]}>
          <Text style={[styles.identityText, { color: accentText }]}>
            {isAnonymous ? 'Identity hidden' : 'Identity shared'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {step === 0 && <Glass style={styles.categoryCard}>
            <Text style={styles.label}>What kind of incident was it?</Text>
            <View style={styles.chipsContainer}>
              {CATEGORY_OPTIONS.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
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
          </Glass>}

          {step === 1 && <>
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
            label="Where did it happen? (optional)"
            placeholder="Hostel B-block, 2nd floor corridor"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.evidenceContainer}>
            <Text style={styles.label}>Evidence (optional)</Text>

            {attachments.length > 0 && (
              <View style={styles.attachmentList}>
                {attachments.map((a) => (
                  <View key={a.uri} style={styles.attachmentRow}>
                    {a.type === 'IMAGE' ? (
                      <ImagePlus size={16} color={accentText} />
                    ) : (
                      <FileText size={16} color={accentText} />
                    )}
                    <Text style={styles.attachmentName} numberOfLines={1}>{a.name}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${a.name}`} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }} onPress={() => removeAttachment(a.uri)}>
                      <X size={16} color={colors.mutedink} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {canAddMore ? (
              <View style={styles.evidenceButtons}>
                <Pressable style={styles.evidenceButton} onPress={pickMedia}>
                  <ImagePlus size={18} strokeWidth={1.8} color={accentText} />
                  <Text style={[styles.evidenceButtonText, { color: accentText }]}>Photo / video</Text>
                </Pressable>
                <Pressable style={styles.evidenceButton} onPress={pickDocument}>
                  <Paperclip size={18} strokeWidth={1.8} color={accentText} />
                  <Text style={[styles.evidenceButtonText, { color: accentText }]}>File</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.dropzoneSubtitle}>Up to {MAX_ATTACHMENTS} attachments.</Text>
            )}
          </View>

          </>}
          {step === 2 && <Glass style={{ gap: 16 }}>
            <Text style={{ ...typography.h2, color: colors.ink }}>Ready when you are</Text>
            <Text style={{ ...typography.body, color: colors.subink }}>Check the details before sending. {isAnonymous ? 'Avoid names or identifying details in your description and attachments if you want to remain anonymous.' : 'Your name will be shared with the committee.'}</Text>
            <Text style={styles.label}>Incident</Text><Text style={{ ...typography.body, color: colors.ink }}>{categoryLabel(category)}</Text>
            <Text style={styles.label}>Your description</Text><Text style={{ ...typography.body, color: colors.ink }}>{description}</Text>
            <Text style={styles.label}>Location</Text><Text style={{ ...typography.body, color: colors.ink }}>{location.trim() || 'Not provided'}</Text>
            <Text style={styles.label}>Evidence</Text><Text style={{ ...typography.body, color: colors.ink }}>{attachments.length ? attachments.map(a => a.name).join(', ') : 'No attachments'}</Text>
            <Text style={{ ...typography.caption, color: colors.subink }}>If you allow location access, your current GPS location will also be included.</Text>
            <Pressable accessibilityRole="button" disabled={submitting} onPress={() => goToStep(1)} style={styles.editDetails}><Text style={{ ...typography.label, color: colors.mintInk }}>Edit details</Text></Pressable>
          </Glass>}
          {error && <Text style={styles.error}>{error}</Text>}
          {uploadNote && <Text style={styles.uploadNote}>{uploadNote}</Text>}

          <Pressable
            style={[styles.submitButton, { backgroundColor: submitBg }, (step > 0 && !canSubmit) && styles.submitButtonDisabled]}
            accessibilityRole="button"
            onPress={() => step < 2 ? goToStep(step + 1) : void handleSubmit()}
            disabled={submitting || (step > 0 && !canSubmit)}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>{step === 0 ? 'Continue to details' : step === 1 ? 'Review report' : 'Submit report'}</Text>
            )}
          </Pressable>
          <Text style={styles.footnote}>
            {step === 1 ? 'A short description is required. Location and evidence are optional.' : 'You can follow updates in My reports after submitting.'}
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
  stepItem: { flex: 1, alignItems: 'center', gap: 8 },
  stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.neutralTint, alignItems: 'center', justifyContent: 'center' },
  editDetails: { minHeight: 48, justifyContent: 'center' },
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
    fontSize: 16,
    color: colors.subink,
    marginBottom: spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
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
  attachmentList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attachmentName: {
    ...typography.caption,
    color: colors.ink,
    flex: 1,
  },
  evidenceButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  evidenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 16,
  },
  evidenceButtonText: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
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
  uploadNote: {
    ...typography.caption,
    color: colors.subink,
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
