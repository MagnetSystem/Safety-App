import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, AlertCircle, ShieldAlert, XCircle } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { radius, spacing, typography } from '../../src/constants/theme';
import { getMyProfile } from '../../src/services/membersService';
import { postMessage } from '../../src/services/incidentsService';
import { listMyGuardians } from '../../src/services/guardiansService';
import { sendEmergencySos, type SosLocationStatus } from '../../src/services/sosService';
import { successFeedback, warningFeedback } from '../../src/services/haptics';
import type { StudentProfile } from '../../src/types';

type StepState = 'pending' | 'done' | 'warn' | 'fail';

function StatusRow({ state, label, detail }: { state: StepState; label: string; detail?: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>
        {state === 'pending' && <ActivityIndicator color="#FFFFFF" size="small" />}
        {state === 'done' && <CheckCircle2 size={22} color="#FFFFFF" strokeWidth={2} />}
        {state === 'warn' && <AlertCircle size={22} color="#FFE8A3" strokeWidth={2} />}
        {state === 'fail' && <XCircle size={22} color="rgba(255,255,255,0.85)" strokeWidth={2} />}
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepLabel}>{label}</Text>
        {detail ? <Text style={styles.stepDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

export default function EmergencyScreen() {
  const router = useRouter();
  const started = useRef(false);

  const [locationState, setLocationState] = useState<StepState>('pending');
  const [locationStatus, setLocationStatus] = useState<SosLocationStatus | null>(null);
  const [alertState, setAlertState] = useState<StepState>('pending');
  const [committeeState, setCommitteeState] = useState<StepState>('pending');
  const [guardianState, setGuardianState] = useState<StepState>('pending');
  const [committeeDetail, setCommitteeDetail] = useState<string | undefined>();
  const [guardianDetail, setGuardianDetail] = useState<string | undefined>();

  const [queuedOffline, setQueuedOffline] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [safeMarked, setSafeMarked] = useState(false);
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const inOrgRef = useRef(false);
  const connectedGuardiansRef = useRef(0);
  const pendingGuardiansRef = useRef(0);

  const applyContext = useCallback((profile: StudentProfile | null, connected: number, pending: number) => {
    inOrgRef.current = !!(profile?.organizationId || profile?.college?.id);
    connectedGuardiansRef.current = connected;
    pendingGuardiansRef.current = pending;
  }, []);

  const finishAlertRows = useCallback((opts: { queued: boolean; failed: boolean; error?: string | null }) => {
    if (opts.failed) {
      setAlertState('fail');
      setCommitteeState('fail');
      setGuardianState('fail');
      setCommitteeDetail(undefined);
      setGuardianDetail(undefined);
      setError(opts.error ?? 'Could not send the alert.');
      warningFeedback();
      setFinished(true);
      return;
    }

    const guardianLine = () => {
      if (connectedGuardiansRef.current > 0) {
        return { state: 'done' as const, detail: opts.queued ? 'Will alert when the SOS sends' : 'They get this emergency alert' };
      }
      if (pendingGuardiansRef.current > 0) {
        return { state: 'warn' as const, detail: 'Invite waiting to be accepted' };
      }
      return { state: 'warn' as const, detail: 'No guardian connected — add one in Profile' };
    };

    if (opts.queued) {
      setAlertState('warn');
      setCommitteeState('warn');
      setCommitteeDetail(inOrgRef.current ? 'Will notify when you are back online' : 'No organization on file');
      const g = guardianLine();
      setGuardianState(g.state);
      setGuardianDetail(g.detail);
      warningFeedback();
    } else {
      setAlertState('done');
      if (inOrgRef.current) {
        setCommitteeState('done');
        setCommitteeDetail('Safety team has your alert');
      } else {
        setCommitteeState('warn');
        setCommitteeDetail('No organization — SOS goes to your guardian');
      }
      const g = guardianLine();
      setGuardianState(g.state);
      setGuardianDetail(g.detail);
      successFeedback();
    }
    setFinished(true);
  }, []);

  const runSend = useCallback(async () => {
    setLocationState('pending');
    setAlertState('pending');
    setCommitteeState('pending');
    setGuardianState('pending');
    setError(null);
    setFinished(false);
    setQueuedOffline(false);
    setComplaintId(null);

    const [profile, guardians] = await Promise.all([
      getMyProfile().catch(() => null),
      listMyGuardians().catch(() => []),
    ]);
    const connected = guardians.filter((g) => g.status === 'ACTIVE' || g.guardian).length;
    applyContext(profile, connected, Math.max(0, guardians.length - connected));

    const result = await sendEmergencySos((loc) => {
      setLocationStatus(loc);
      setLocationState(loc === 'active' ? 'done' : 'warn');
    });
    setLocationStatus(result.location);
    setLocationState(result.location === 'active' ? 'done' : 'warn');

    if (result.error) {
      finishAlertRows({ queued: false, failed: true, error: result.error });
      return;
    }

    setQueuedOffline(result.queuedOffline);
    setComplaintId(result.complaintId);
    finishAlertRows({ queued: result.queuedOffline, failed: false });
  }, [applyContext, finishAlertRows]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runSend();
  }, [runSend]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!finished) return true;
      return false;
    });
    return () => sub.remove();
  }, [finished]);

  const handleRetry = async () => {
    setRetrying(true);
    started.current = true;
    await runSend();
    setRetrying(false);
  };

  const handleSafe = async () => {
    if (!complaintId || safeMarked) return;
    setSafeMarked(true);
    successFeedback();
    try {
      await postMessage(complaintId, "I'm safe now.");
    } catch {
      setSafeMarked(false);
    }
  };

  const handleNote = async () => {
    const body = note.trim();
    if (!body || !complaintId || noteBusy || noteSaved) return;
    setNoteBusy(true);
    try {
      await postMessage(complaintId, body);
      setNoteSaved(true);
      successFeedback();
    } catch {
      setError('Could not add your note. Try again.');
    } finally {
      setNoteBusy(false);
    }
  };

  const title = !finished
    ? 'Sending SOS'
    : queuedOffline
      ? 'Alert saved'
      : error
        ? 'Could not send'
        : 'Help is on the way';

  const subtitle = !finished
    ? 'Stay on this screen. We are notifying people who can help.'
    : queuedOffline
      ? 'You are offline. The alert will send automatically when you have a connection.'
      : error
        ? error
        : 'Stay where you are if it is safe, or move to a crowded public area.';

  return (
    <Screen padded isEmergency>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              {finished && !error ? (
                <CheckCircle2 size={56} strokeWidth={1.6} color="#FFFFFF" />
              ) : (
                <ShieldAlert size={56} strokeWidth={1.6} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>
            <StatusRow
              state={locationState}
              label={locationState === 'pending' ? 'Getting your location' : locationStatus === 'active' ? 'Location attached' : 'Location unavailable'}
              detail={locationStatus === 'denied' ? 'The alert still sends without GPS' : undefined}
            />
            <View style={styles.stepDivider} />
            <StatusRow
              state={alertState}
              label={
                alertState === 'pending'
                  ? 'Sending alert'
                  : queuedOffline
                    ? 'Alert saved on this device'
                    : alertState === 'fail'
                      ? 'Alert did not send'
                      : 'Alert sent'
              }
            />
            <View style={styles.stepDivider} />
            <StatusRow
              state={committeeState}
              label={committeeState === 'pending' ? 'Notifying committee' : 'Committee'}
              detail={committeeDetail}
            />
            <View style={styles.stepDivider} />
            <StatusRow
              state={guardianState}
              label={guardianState === 'pending' ? 'Notifying guardian' : 'Guardian'}
              detail={guardianDetail}
            />
          </View>

          {finished && complaintId && !noteSaved && (
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>Add a note (optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What is happening, where you are…"
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={note}
                onChangeText={setNote}
                multiline
              />
              <Pressable
                style={[styles.noteBtn, (!note.trim() || noteBusy) && styles.btnDisabled]}
                onPress={handleNote}
                disabled={!note.trim() || noteBusy}
              >
                <Text style={styles.noteBtnText}>{noteBusy ? 'Saving…' : 'Send note'}</Text>
              </Pressable>
            </View>
          )}
          {noteSaved && <Text style={styles.noteSaved}>Note added to your alert.</Text>}

          {finished && complaintId && (
            <Pressable
              style={[styles.safeBtn, safeMarked && styles.safeBtnDone]}
              disabled={safeMarked}
              onPress={handleSafe}
            >
              <Text style={styles.safeText}>
                {safeMarked ? "The committee has been told you're safe" : "I'm safe now"}
              </Text>
            </Pressable>
          )}

          {finished && error && (
            <Pressable style={styles.safeBtn} onPress={handleRetry} disabled={retrying}>
              <Text style={styles.safeText}>{retrying ? 'Trying again…' : 'Try again'}</Text>
            </Pressable>
          )}

          {finished && (
            <Pressable style={styles.doneBtn} onPress={() => router.replace('/(tabs)/home')}>
              <Text style={styles.doneText}>Return to home</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  heroIcon: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  stepDetail: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    lineHeight: 18,
  },
  stepDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  noteBlock: {
    marginTop: spacing.xl,
  },
  noteLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.sm,
  },
  noteInput: {
    minHeight: 72,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    textAlignVertical: 'top',
  },
  noteBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  noteBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  noteSaved: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  safeBtn: {
    marginTop: 28,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  safeBtnDone: {
    opacity: 0.7,
  },
  safeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  doneBtn: {
    marginTop: spacing.md,
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
});
