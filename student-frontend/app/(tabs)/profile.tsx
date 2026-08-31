import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { HeartPulse } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader } from '../../src/components/ui-kit';
import { getMyProfile } from '../../src/services/studentsService';
import type { StudentProfile } from '../../src/types';
import { colors, spacing, typography } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const NOT_SET = 'Not set';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMyProfile()
        .then((p) => {
          setProfile(p);
          setError(null);
        })
        .catch(() => setError('Could not load your profile.'))
        .finally(() => setLoading(false));
    }, [])
  );

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <Screen padded>
        <ActivityIndicator color={colors.indigoink} style={styles.loading} />
      </Screen>
    );
  }

  const name = profile?.name ?? 'Student';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="Profile" />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.college}>{profile?.college?.name ?? NOT_SET}</Text>
        </View>

        <Glass style={styles.detailsCard}>
          <Row label="Roll number" value={profile?.studentNumber ?? NOT_SET} />
          <View style={styles.divider} />
          <Row label="Email" value={profile?.user?.email ?? NOT_SET} />
          <View style={styles.divider} />
          <Row
            label="Course"
            value={[profile?.department, profile?.course, profile?.year ? `Year ${profile.year}` : null].filter(Boolean).join(' · ') || NOT_SET}
          />
        </Glass>

        <Glass style={styles.medicalCard}>
          <View style={styles.medicalHeader}>
            <HeartPulse size={18} strokeWidth={1.8} color={colors.indigoink} />
            <Text style={styles.medicalTitle}>Emergency medical info</Text>
          </View>
          <Text style={styles.medicalDesc}>
            Shared only when you send an emergency alert.
          </Text>
          <View style={styles.medicalContent}>
            <Row label="Blood group" value={profile?.bloodGroup ?? NOT_SET} />
            <View style={styles.divider} />
            <Row label="Allergies" value={profile?.allergies ?? NOT_SET} />
            <View style={styles.divider} />
            <Row label="Conditions" value={profile?.medicalConditions ?? NOT_SET} />
          </View>
        </Glass>

        <Pressable
          style={styles.signOutBtn}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(91, 110, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarInitials: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: colors.indigoink,
  },
  name: {
    ...typography.h1,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  college: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginTop: 4,
  },
  detailsCard: {
    paddingVertical: spacing.md,
  },
  medicalCard: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  medicalTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  medicalDesc: {
    ...typography.caption,
    color: colors.mutedink,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  medicalContent: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.mutedink,
  },
  rowValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    maxWidth: '62%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  signOutBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.indigoink,
  },
});
