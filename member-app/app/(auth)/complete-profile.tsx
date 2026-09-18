import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/ui-kit';
import { ProfileFieldInput } from '../../src/components/ProfileFieldInput';
import { Screen } from '../../src/components/PhoneFrame';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';
import { getMyProfile, updateMyProfile } from '../../src/services/membersService';
import { isValidIsoDate, buildProfilePatch, resolveMemberFields, isGuardianOnlyProfile, FALLBACK_PROFILE_FIELDS } from '../../src/lib/profileFields';
import { useAuth } from '../../src/store/AuthContext';
import { Check } from 'lucide-react-native';
import type { ProfileFieldDef } from '../../src/types';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { refreshProfileStatus } = useAuth();
  const [fields, setFields] = useState<ProfileFieldDef[]>(FALLBACK_PROFILE_FIELDS);
  const [values, setValues] = useState<Record<string, string>>({});
  const [orgLabel, setOrgLabel] = useState<string | null>(null);
  const [isGuardian, setIsGuardian] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        const usable = resolveMemberFields(p);
        setFields(usable);
        setIsGuardian(isGuardianOnlyProfile(p));
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
    return fields.every((f) => {
      const value = (values[f.key] ?? '').toString().trim();
      if (f.required && value.length === 0) return false;
      if (f.type === 'date' && value && !isValidIsoDate(value)) return false;
      return true;
    });
  }, [fields, values]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const { columnPatch, profile } = buildProfilePatch(fields, values);
      await updateMyProfile({ ...columnPatch, profile } as any);
      await refreshProfileStatus();
      // Let index.tsx pick Home vs. the guardian-only Alerts tab based on organization status.
      router.replace('/');
    } catch (err: any) {
      const raw = err.response?.data?.message;
      setError((Array.isArray(raw) ? raw.join('\n') : raw) || err.message || 'Could not save your profile details.');
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
          subtitle={
            isGuardian
              ? "Just so the people you watch over can reach you."
              : orgLabel
                ? `Fields for ${orgLabel}. Medical details are only used in emergencies.`
                : 'Only what responders need if you trigger SOS.'
          }
        />

        <View style={styles.form}>
          {Object.entries(grouped).map(([group, groupFields]) => (
            <View key={group} style={{ gap: spacing.md }}>
              <Text style={styles.sectionTitle}>{group.replace(/_/g, ' ')}</Text>
              {groupFields.map((f) => (
                <ProfileFieldInput key={f.key} field={f} value={values[f.key] ?? ''} onChange={(v) => setValue(f.key, v)} />
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

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  form: { marginTop: spacing.xl, gap: spacing.lg },
  sectionTitle: { ...typography.h3, fontSize: 16, color: colors.indigoink, textTransform: 'capitalize' },
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
