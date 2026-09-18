import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, StatusPill, LoadingCards, EmptyState } from '../../src/components/ui-kit';
import { listWardAlerts, type WardAlert } from '../../src/services/guardiansService';
import type { ComplaintStatus } from '../../src/types';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function WardsScreen() {
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);
  const [alerts, setAlerts] = useState<WardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listWardAlerts()
      .then((data) => {
        setWards(data.wards);
        setAlerts(data.alerts);
        setError(null);
      })
      .catch(() => setError('Could not load guardian alerts.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openLocation = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="Watching" subtitle="Emergency alerts from the people you watch over" />

        {loading ? (
          <LoadingCards />
        ) : error ? (
          <EmptyState title="Alerts could not load" message={error} onRetry={load} />
        ) : wards.length === 0 ? (
          <EmptyState
            title="You're not watching anyone yet"
            message="Ask a member to share their guardian invite code with you, then accept it from Profile → Who I'm watching."
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              Watching {wards.length} {wards.length === 1 ? 'person' : 'people'}
            </Text>
            <View style={styles.wardChips}>
              {wards.map((w) => (
                <View key={w.id} style={styles.wardChip}>
                  <Text style={styles.wardChipText}>{w.name}</Text>
                </View>
              ))}
            </View>

            {alerts.length === 0 ? (
              <EmptyState
                title="No alerts"
                message="You'll be notified immediately if any of them trigger Emergency SOS."
              />
            ) : (
              <View style={styles.alertList}>
                {alerts.map((a) => (
                  <Glass key={a.id} style={styles.alertCard}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertName}>{a.member?.name ?? 'Member'}</Text>
                      <StatusPill status={a.status as ComplaintStatus} />
                    </View>
                    <Text style={styles.alertTime}>{new Date(a.createdAt).toLocaleString()}</Text>
                    {a.gpsLat != null && a.gpsLng != null ? (
                      <Pressable style={styles.locationBtn} onPress={() => openLocation(a.gpsLat!, a.gpsLng!)}>
                        <MapPin size={16} color={colors.indigoink} />
                        <Text style={styles.locationBtnText}>View last known location</Text>
                        <ChevronRight size={16} color={colors.indigoink} />
                      </Pressable>
                    ) : (
                      <Text style={styles.noLocation}>No location was captured for this alert.</Text>
                    )}
                  </Glass>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.mutedink,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  wardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  wardChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.lavenderTint,
  },
  wardChipText: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
    color: colors.indigoink,
  },
  alertList: {
    gap: spacing.md,
  },
  alertCard: {
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  alertName: {
    ...typography.h3,
    fontSize: 16,
    color: colors.ink,
  },
  alertTime: {
    ...typography.caption,
    color: colors.mutedink,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.input,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignSelf: 'flex-start',
  },
  locationBtnText: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
    color: colors.indigoink,
  },
  noLocation: {
    ...typography.caption,
    color: colors.mutedink,
    fontStyle: 'italic',
  },
});
