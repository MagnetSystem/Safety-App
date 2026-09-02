import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Linking, Pressable, TextInput,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MapPin, FileCheck2, Paperclip, Send } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, StatusPill } from '../../src/components/ui-kit';
import {
  getReportById, getMessages, postMessage, type ComplaintMessage,
} from '../../src/services/complaintsService';
import { getEvidence } from '../../src/services/evidenceService';
import { categoryLabel, statusLabel, WORKFLOW_STATUSES, type EvidenceItem, type Report } from '../../src/types';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    Promise.all([
      getReportById(id),
      getEvidence(id).catch(() => [] as EvidenceItem[]),
      getMessages(id).catch(() => [] as ComplaintMessage[]),
    ])
      .then(([data, ev, msgs]) => {
        setReport(data);
        setEvidence(ev);
        setMessages(msgs);
        setError(null);
      })
      .catch(() => setError('Could not load this report.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [id]);

  const sendMessage = async () => {
    const body = draft.trim();
    if (!body || !id || sending) return;
    setSending(true);
    try {
      const msg = await postMessage(id, body);
      setMessages((prev) => [...prev, msg]);
      setDraft('');
    } catch {
      setError('Could not send your message. Try again.');
    } finally {
      setSending(false);
    }
  };

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

        {report.resolutionReport && (
          <Glass style={[styles.card, styles.resolutionCard]}>
            <View style={styles.resolutionHeader}>
              <FileCheck2 size={16} color={colors.mintInk} />
              <Text style={styles.resolutionLabel}>Committee&apos;s resolution</Text>
            </View>
            <Text style={styles.bodyText}>{report.resolutionReport}</Text>
          </Glass>
        )}

        {evidence.length > 0 && (
          <Glass style={styles.card}>
            <Text style={styles.label}>Evidence you attached</Text>
            <View style={styles.evidenceList}>
              {evidence.map((e) => (
                <Pressable
                  key={e.id}
                  style={styles.evidenceRow}
                  onPress={() => e.downloadUrl && Linking.openURL(e.downloadUrl)}
                >
                  <Paperclip size={15} color={colors.indigoink} />
                  <Text style={styles.evidenceName} numberOfLines={1}>{e.fileName}</Text>
                </Pressable>
              ))}
            </View>
          </Glass>
        )}

        <Glass
          style={
            report.status === 'MORE_INFO_REQUESTED'
              ? [styles.card, styles.conversationHighlight]
              : styles.card
          }
        >
          <Text style={styles.label}>
            {report.status === 'MORE_INFO_REQUESTED'
              ? 'The committee needs more information'
              : 'Conversation with the committee'}
          </Text>

          {messages.length === 0 ? (
            <Text style={styles.conversationEmpty}>
              No messages yet. You can add anything you remember or want the committee to know.
            </Text>
          ) : (
            <View style={styles.messageList}>
              {messages.map((m) => {
                const mine = m.authorRole === 'STUDENT';
                return (
                  <View key={m.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleThem]}>
                    <Text style={styles.bubbleAuthor}>{mine ? 'You' : 'Committee'}</Text>
                    <Text style={styles.bubbleBody}>{m.body}</Text>
                    <Text style={styles.bubbleDate}>{new Date(m.createdAt).toLocaleString()}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              placeholder="Write a message…"
              placeholderTextColor={colors.mutedink}
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <Pressable
              style={[styles.composerSend, (!draft.trim() || sending) && styles.composerSendDisabled]}
              onPress={sendMessage}
              disabled={!draft.trim() || sending}
            >
              {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={16} color="#FFF" />}
            </Pressable>
          </View>
        </Glass>

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
  resolutionCard: {
    borderColor: 'rgba(79, 184, 155, 0.35)',
    backgroundColor: 'rgba(225, 245, 238, 0.5)',
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resolutionLabel: {
    ...typography.caption,
    fontFamily: 'Inter_500Medium',
    color: colors.mintInk,
  },
  evidenceList: {
    gap: spacing.sm,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  evidenceName: {
    ...typography.body,
    fontSize: 13,
    color: colors.indigoink,
    flex: 1,
  },
  conversationHighlight: {
    borderColor: 'rgba(166, 106, 31, 0.4)',
    backgroundColor: 'rgba(255, 243, 221, 0.5)',
  },
  conversationEmpty: {
    ...typography.caption,
    color: colors.mutedink,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  messageList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bubble: {
    borderRadius: radius.md,
    padding: spacing.md,
    maxWidth: '90%',
  },
  bubbleMine: {
    backgroundColor: colors.lavenderTint,
    alignSelf: 'flex-end',
  },
  bubbleThem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-start',
  },
  bubbleAuthor: {
    ...typography.caption,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.subink,
    marginBottom: 2,
  },
  bubbleBody: {
    ...typography.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
  bubbleDate: {
    ...typography.caption,
    fontSize: 10,
    color: colors.mutedink,
    marginTop: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  composerInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  composerSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.indigoink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendDisabled: {
    opacity: 0.4,
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
