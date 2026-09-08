import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, radius, spacing, typography, shadows } from '../../src/constants/theme';
import { getMyProfile, updateMyProfile } from '../../src/services/studentsService';
import { Check } from 'lucide-react-native';
import type { ProfileFieldDef } from '../../src/types';

const COLUMN_KEYS = new Set([
  'name', 'mobile', 'dateOfBirth', 'gender', 'memberNumber', 'studentNumber',
  'department', 'course', 'semester', 'year', 'section', 'isHosteler',
  'hostelAddress', 'hostelRoomNumber', 'permanentAddress',
  'emergencyContactName', 'emergencyContactPhone', 'bloodGroup',
  'medicalConditions', 'allergies', 'disability',
]);

const FALLBACK_FIELDS: ProfileFieldDef[] = [
  { key: 'mobile', label: 'Mobile number', type: 'tel', group: 'identity', required: true },
  { key: 'emergencyContactName', label: 'Emergency contact name', type: 'text', group: 'emergency', required: true },
  { key: 'emergencyContactPhone', label: 'Emergency contact phone', type: 'tel', group: 'emergency', required: true },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [fields, setFields] = useState<ProfileFieldDef[]>(FALLBACK_FIELDS);
  const [values, setValues] = useState<Record<string, string>>({});
  const [orgLabel, setOrgLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        const defs =
          p.organization?.organizationType?.memberFields ??
          p.organization?.settings?.profileFieldDefs ??
          FALLBACK_FIELDS;
        const usable = defs.filter((f) => f.key !== 'name');
        setFields(usable.length ? usable : FALLBACK_FIELDS);
        setOrgLabel(p.organization?.organizationType?.label ?? p.organization?.name ?? null);
        const next: Record<string, string> = {};
        for (const f of usable) {
          const fromColumn = (p as Record<string, unknown>)[f.key];
          const fromProfile = p.profile?.[f.key];
          const raw = fromColumn ?? fromProfile ?? '';
          next[f.key] = raw === true ? 'true' : raw === false ? 'false' : String(raw ?? '');
        }
        setValues(next);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const canSubmit = useMemo(() => {
    return fields.every((f) => !f.required || (values[f.key] ?? '').toString().trim().length > 0);
  }, [fields, values]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const columnPatch: Record<string, unknown> = {};
      const profile: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = (values[f.key] ?? '').trim();
        let parsed: unknown = raw;
        if (f.type === 'number') parsed = raw ? Number(raw) : undefined;
        if (f.type === 'boolean') parsed = raw === 'true' || raw === '1';
        if (f.key === 'memberNumber') columnPatch.studentNumber = raw;
        if (COLUMN_KEYS.has(f.key)) columnPatch[f.key] = parsed;
        else profile[f.key] = parsed;
      }
      await updateMyProfile({ ...columnPatch, profile } as any);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not save your profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = fields.reduce<Record<string, ProfileFieldDef[]>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  if (loading) {
    return (
      <Screen padded>
        <ActivityIndicator color={colors.indigoink} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Complete profile"
          subtitle={orgLabel ? `Fields for ${orgLabel}. Medical details are only used in emergencies.` : 'Only what responders need if you trigger SOS.'}
        />

        <View style={styles.form}>
          {Object.entries(grouped).map(([group, groupFields]) => (
            <View key={group} style={{ gap: spacing.md }}>
              <Text style={styles.sectionTitle}>{group.replace(/_/g, ' ')}</Text>
              {groupFields.map((f) => (
                <FieldInput key={f.key} field={f} value={values[f.key] ?? ''} onChange={(v) => setValue(f.key, v)} />
              ))}
            </View>
          ))}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Complete setup</Text>
                <Check size={20} color="#FFF" />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ProfileFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const label = `${field.label}${field.required ? ' *' : ''}`;
  if (field.type === 'boolean') {
    return (
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch value={value === 'true'} onValueChange={(v) => onChange(v ? 'true' : 'false')} />
      </View>
    );
  }
  if (field.type === 'select' && field.options?.length) {
    return (
      <View>
        <Text style={styles.switchLabel}>{label}</Text>
        <View style={styles.radioGroup}>
          {field.options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.radioOption, value === opt && styles.radioOptionActive]}
            >
              <Text style={[styles.radioText, value === opt && styles.radioTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  return (
    <GlassInput
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder={field.help || field.label}
      keyboardType={field.type === 'tel' ? 'phone-pad' : field.type === 'number' ? 'number-pad' : 'default'}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  form: { marginTop: spacing.xl, gap: spacing.lg },
  sectionTitle: { ...typography.h3, fontSize: 16, color: colors.indigoink, textTransform: 'capitalize' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { ...typography.body, fontSize: 14, color: colors.subink, marginBottom: spacing.sm },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioOptionActive: { backgroundColor: colors.lavenderTint, borderColor: colors.lavender },
  radioText: { ...typography.body, color: colors.subink },
  radioTextActive: { color: colors.indigoink, fontFamily: 'Inter_500Medium' },
  error: { ...typography.caption, color: '#C0433E', textAlign: 'center' },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.indigoink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    ...shadows.soft,
    gap: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#FFFFFF' },
});
