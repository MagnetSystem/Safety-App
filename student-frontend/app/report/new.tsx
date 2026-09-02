import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ImagePlus, Paperclip, X, FileText } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, GlassInput } from '../../src/components/ui-kit';
import { CATEGORY_OPTIONS, categoryLabel, type IncidentCategoryEnum } from '../../src/types';
import { createComplaint } from '../../src/services/complaintsService';
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
    try {
      const complaint = await createComplaint({
        type: isAnonymous ? 'ANONYMOUS' : 'NORMAL',
        category,
        description: description.trim(),
        location: location.trim() || undefined,
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title={isAnonymous ? 'Incident report' : 'Normal report'}
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
                    <Pressable onPress={() => removeAttachment(a.uri)} hitSlop={8}>
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

          {error && <Text style={styles.error}>{error}</Text>}
          {uploadNote && <Text style={styles.uploadNote}>{uploadNote}</Text>}

          <Pressable
            style={[styles.submitButton, { backgroundColor: submitBg }, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit report</Text>
            )}
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
