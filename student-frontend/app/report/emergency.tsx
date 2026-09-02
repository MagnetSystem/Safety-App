import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { Screen } from '../../src/components/PhoneFrame';
import { GlassInput } from '../../src/components/ui-kit';
import { colors, radius, spacing, typography, gradients } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/store/AuthContext';
import { getMyProfile } from '../../src/services/studentsService';
import { createComplaint } from '../../src/services/complaintsService';
import { CATEGORY_OPTIONS, categoryLabel, type IncidentCategoryEnum } from '../../src/types';

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<IncidentCategoryEnum>(CATEGORY_OPTIONS[0]);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'active' | 'denied'>('idle');
  const [displayName, setDisplayName] = useState(user?.email ?? '');

  React.useEffect(() => {
    getMyProfile()
      .then((p) => setDisplayName(p.name))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    setError(null);
    setSending(true);

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
        setLocationStatus('active');
      } else {
        setLocationStatus('denied');
      }
    } catch {
      setLocationStatus('denied');
    }

    const deviceInfo = `${Device.modelName ?? Platform.OS} · ${Device.osName ?? Platform.OS} ${Device.osVersion ?? Platform.Version}`;

    try {
      await createComplaint({
        type: 'EMERGENCY',
        category,
        description: note.trim() || 'Emergency SOS alert — no additional details provided.',
        gpsLat: gps.gpsLat,
        gpsLng: gps.gpsLng,
        gpsAccuracy: gps.gpsAccuracy,
        deviceInfo,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not send the alert. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <Screen padded style={styles.successScreen}>
        <View style={styles.successContent}>
          <CheckCircle2 size={80} strokeWidth={1.5} color="#FFFFFF" />
          <Text style={styles.successTitle}>Alert sent</Text>
          <Text style={styles.successDesc}>
            Your college safety committee has been notified{locationStatus === 'active' ? ' with your live location' : ''}.
          </Text>
          <Text style={styles.successInstruction}>
            Stay where you are if it's safe, or move to a crowded public area.
          </Text>

          <Pressable
            style={styles.doneBtn}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.doneText}>Return to home</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </View>

        <View style={styles.alertIconWrapper}>
          <TriangleAlert size={48} strokeWidth={1.5} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Emergency alert</Text>
        <Text style={styles.subtitle}>
          This will instantly notify your college&apos;s safety committee with your location, if available.
        </Text>

        <View style={styles.dataCard}>
          <Text style={styles.dataLabel}>What they will receive</Text>
          <View style={styles.dataContent}>
            <Row label="Identity" value={displayName || '—'} />
            <View style={styles.divider} />
            <Row label="Location" value="Requested when you send" valueHighlight />
            <View style={styles.divider} />
            <Row label="Device info" value={`${Device.modelName ?? Platform.OS} (${Device.osName ?? Platform.OS} ${Device.osVersion ?? Platform.Version})`} />
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>What is happening? (optional)</Text>
          <View style={styles.chipsContainer}>
            {CATEGORY_OPTIONS.map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {categoryLabel(c)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.noteContainer}>
          <GlassInput
            label="Additional context (optional)"
            placeholder="Type quickly here..."
            style={styles.textArea}
            multiline
            numberOfLines={2}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.sosButton, sending && styles.sosButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          <LinearGradient colors={gradients.coral} locations={gradients.coralLocations} style={styles.sosGradient}>
            <ShieldAlert size={20} strokeWidth={2.2} color="#FFFFFF" />
            <Text style={styles.sosText}>{sending ? 'Sending…' : 'Send SOS now'}</Text>
          </LinearGradient>
        </Pressable>

      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, valueHighlight }: { label: string; value: string; valueHighlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueHighlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  successScreen: {
    backgroundColor: '#E0605C',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  successTitle: {
    ...typography.h1,
    fontSize: 28,
    color: '#FFFFFF',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  successDesc: {
    ...typography.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
  },
  successInstruction: {
    ...typography.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  doneBtn: {
    marginTop: 48,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  doneText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#E0605C',
  },

  header: {
    paddingVertical: spacing.md,
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    ...typography.body,
    color: colors.mutedink,
  },
  alertIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0605C',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#E0605C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  dataLabel: {
    ...typography.h3,
    color: colors.ink,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  dataContent: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.mutedink,
  },
  rowValue: {
    ...typography.caption,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    maxWidth: '65%',
  },
  rowValueHighlight: {
    color: '#E0605C',
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoryContainer: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    marginBottom: spacing.sm,
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
  chipActive: {
    backgroundColor: '#FFFFFF',
  },
  chipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  chipText: {
    ...typography.caption,
  },
  chipTextActive: {
    color: '#E0605C',
    fontFamily: 'Inter_500Medium',
  },
  chipTextInactive: {
    color: colors.subink,
  },
  noteContainer: {
    marginBottom: spacing.xl,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sosButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#E0605C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    marginBottom: spacing.xxl,
  },
  sosButtonDisabled: {
    opacity: 0.7,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: spacing.sm,
  },
  sosText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
