import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, StatusPill } from '../../src/components/ui-kit';
import { getReportById } from '../../src/services/complaintsService';
import { categoryLabel, statusLabel, WORKFLOW_STATUSES, type Report } from '../../src/types';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    getReportById(id)
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch(() => setError('Could not load this report.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen padded>
        <ActivityIndicator color={colors.indigoink} style={styles.loading} />
      </Screen>
    );
  }

  if (error || !report) {
    return (
      <Screen padded>
        <ScreenHeader title="Report" back="/(tabs)/reports" />
        <Glass style={styles.card}>
          <Text style={styles.bodyText}>{error ?? 'Report not found.'}</Text>
        </Glass>
      </Screen>
    );
  }

  const currentStepIndex = WORKFLOW_STATUSES.indexOf(report.status);
  const timelineByStatus = new Map(report.timeline.map((t) => [t.status, t]));

  return (
    <Screen padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.indigoink} />}
      >
        <ScreenHeader
          title={categoryLabel(report.category)}
          subtitle={`${report.code} · ${new Date(report.createdAt).toLocaleDateString()}`}
          back="/(tabs)/reports"
        />

        <View style={styles.badgesRow}>
          <StatusPill status={report.status} />
          <View style={[styles.typeBadge, { backgroundColor: report.type === 'ANONYMOUS' ? colors.lavenderTint : colors.mintTint }]}>
            <Text style={[styles.typeText, { color: report.type === 'ANONYMOUS' ? colors.lavender : colors.mintInk }]}>
              {report.type === 'ANONYMOUS' ? 'Anonymous' : report.type === 'EMERGENCY' ? 'Emergency' : 'Normal'}
            </Text>
          </View>
        </View>

        <Glass style={styles.card}>
          <Text style={styles.label}>What happened</Text>
          <Text style={styles.bodyText}>{report.description}</Text>
        </Glass>

        {report.location && (
          <Glass style={styles.card}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.indigoink} style={styles.locationIcon} />
              <Text style={styles.bodyText}>{report.location}</Text>
            </View>
          </Glass>
        )}

        <Glass style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progress</Text>
          <View style={styles.timeline}>
            {WORKFLOW_STATUSES.map((step, i) => {
              const done = i <= currentStepIndex;
              const isLast = i === WORKFLOW_STATUSES.length - 1;
              const entry = timelineByStatus.get(step);
              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineDotCol}>
                    <View style={[styles.dot, done ? styles.dotDone : styles.dotUpcoming]} />
                    {!isLast && <View style={[styles.line, done ? styles.lineDone : styles.lineUpcoming]} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.stepText, done ? styles.stepTextDone : styles.stepTextUpcoming]}>
                      {statusLabel(step)}
                    </Text>
                    {entry && (
                      <Text style={styles.stepDate}>
                        {new Date(entry.createdAt).toLocaleString()}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Glass>
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: {
    ...typography.caption,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.mutedink,
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  locationIcon: {
    marginTop: 2,
  },
  progressCard: {
    padding: spacing.lg,
  },
  progressTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineDotCol: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 10,
  },
  dotDone: {
    backgroundColor: colors.indigoink,
  },
  dotUpcoming: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(107, 107, 102, 0.25)',
  },
  line: {
    width: 1,
    flex: 1,
    minHeight: 24,
  },
  lineDone: {
    backgroundColor: 'rgba(91, 110, 232, 0.4)',
  },
  lineUpcoming: {
    backgroundColor: colors.neutralTint,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepText: {
    ...typography.body,
    fontSize: 14,
  },
  stepTextDone: {
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
  },
  stepTextUpcoming: {
    color: colors.mutedink,
  },
  stepDate: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: 2,
  },
});
