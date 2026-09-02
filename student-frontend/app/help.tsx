import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Phone, Mail, Globe, ShieldAlert } from 'lucide-react-native';
import { Screen } from '../src/components/PhoneFrame';
import { Glass, ScreenHeader } from '../src/components/ui-kit';
import { getMyProfile } from '../src/services/studentsService';
import type { StudentProfile } from '../src/types';
import { colors, radius, spacing, typography } from '../src/constants/theme';

interface Contact {
  label: string;
  value: string;
  hint?: string;
  action: 'call' | 'mail' | 'web';
}

const NATIONAL: Contact[] = [
  { label: 'National Anti-Ragging Helpline', value: '1800-180-5522', hint: '24×7, toll-free', action: 'call' },
  { label: 'Anti-Ragging cell (email)', value: 'helpline@antiragging.in', action: 'mail' },
  { label: 'antiragging.in', value: 'https://www.antiragging.in', hint: 'File a complaint online', action: 'web' },
];

const EMERGENCY: Contact[] = [
  { label: 'All-in-one emergency', value: '112', action: 'call' },
  { label: 'Police', value: '100', action: 'call' },
  { label: 'Ambulance', value: '108', action: 'call' },
  { label: 'Women helpline', value: '1091', action: 'call' },
  { label: 'Student / child helpline', value: '1098', action: 'call' },
  { label: 'Mental health support (Tele-MANAS)', value: '14416', action: 'call' },
];

function openContact(c: Contact) {
  if (c.action === 'call') Linking.openURL(`tel:${c.value.replace(/[^+\d]/g, '')}`);
  else if (c.action === 'mail') Linking.openURL(`mailto:${c.value}`);
  else Linking.openURL(c.value);
}

function Row({ c }: { c: Contact }) {
  const Icon = c.action === 'call' ? Phone : c.action === 'mail' ? Mail : Globe;
  return (
    <Pressable style={styles.row} onPress={() => openContact(c)}>
      <View style={styles.rowIcon}>
        <Icon size={16} color={colors.indigoink} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{c.label}</Text>
        <Text style={styles.rowValue}>
          {c.value}
          {c.hint ? <Text style={styles.rowHint}>  ·  {c.hint}</Text> : null}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HelpScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMyProfile().then(setProfile).catch(() => {});
    }, [])
  );

  const collegePhone = (profile?.college as { phone?: string } | undefined)?.phone;

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Get help now"
          subtitle="You are not alone. Reach out to any of these."
          back="/(tabs)/home"
        />

        <View style={styles.reassure}>
          <ShieldAlert size={16} color={colors.mintInk} />
          <Text style={styles.reassureText}>
            Calling a helpline never affects your report or your anonymity.
          </Text>
        </View>

        {(profile?.college?.name || collegePhone) && (
          <Glass style={styles.card}>
            <Text style={styles.cardTitle}>Your campus</Text>
            {collegePhone ? (
              <Row c={{ label: profile?.college?.name ?? 'Campus office', value: collegePhone, action: 'call' }} />
            ) : (
              <Text style={styles.muted}>
                {profile?.college?.name} — no campus number on file. Use the anti-ragging helpline below.
              </Text>
            )}
          </Glass>
        )}

        <Glass style={styles.card}>
          <Text style={styles.cardTitle}>Anti-ragging</Text>
          {NATIONAL.map((c) => <Row key={c.value} c={c} />)}
        </Glass>

        <Glass style={styles.card}>
          <Text style={styles.cardTitle}>Emergency services</Text>
          {EMERGENCY.map((c) => <Row key={c.value} c={c} />)}
        </Glass>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  reassure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mintTint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  reassureText: {
    ...typography.caption,
    color: colors.mintInk,
    flex: 1,
    lineHeight: 17,
  },
  card: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(91, 110, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
  },
  rowValue: {
    ...typography.caption,
    color: colors.subink,
    marginTop: 2,
  },
  rowHint: {
    color: colors.mutedink,
  },
  muted: {
    ...typography.caption,
    color: colors.mutedink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    lineHeight: 18,
  },
});
