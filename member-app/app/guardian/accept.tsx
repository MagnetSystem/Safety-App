import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, Check, X, HeartHandshake } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, GlassInput, ScreenHeader } from '../../src/components/ui-kit';
import { colors, spacing, typography, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { acceptGuardianCode } from '../../src/services/guardiansService';
import {
  savePendingGuardianCode,
  getPendingGuardianCode,
  clearPendingGuardianCode,
} from '../../src/services/pendingGuardianCode';

type Status = 'idle' | 'accepting' | 'success' | 'error';

/**
 * Lands here from a guardian-invite deep link (`studentapp://guardian/accept?code=...`), or from
 * a manual visit. Works whether or not the visitor has a session yet — AuthContext exempts this
 * route from its login/complete-profile redirects so the code survives a login/register detour.
 */
export default function GuardianAcceptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [code, setCode] = useState(params.code ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wardName, setWardName] = useState<string | null>(null);
  const autoAttempted = useRef(false);

  // Seed the code field: the URL param first, otherwise whatever survived a login/register detour.
  useEffect(() => {
    (async () => {
      if (params.code) {
        setCode(params.code);
        await savePendingGuardianCode(params.code);
        return;
      }
      const pending = await getPendingGuardianCode();
      if (pending) setCode(pending);
    })();
  }, [params.code]);

  const attemptAccept = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setStatus('accepting');
    setErrorMsg(null);
    try {
      const result = await acceptGuardianCode(trimmed);
      setWardName((result as { member?: { name?: string } })?.member?.name ?? null);
      setStatus('success');
      await clearPendingGuardianCode();
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.message ?? 'Could not accept this invite.');
    }
  }, []);

  // Auto-accept once, the moment we have both a session and a code.
  useEffect(() => {
    if (authLoading || autoAttempted.current) return;
    if (isAuthenticated && code.trim()) {
      autoAttempted.current = true;
      attemptAccept(code);
    }
  }, [authLoading, isAuthenticated, code, attemptAccept]);

  const goToGuardianSection = () => router.replace('/(tabs)/wards' as any);

  if (authLoading) {
    return (
      <Screen padded>
        <ActivityIndicator color={colors.indigoink} style={styles.loading} />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen padded>
        <ScreenHeader title="Guardian invite" subtitle="One more step to connect" />
        <Glass style={styles.card}>
          <View style={styles.iconCircle}>
            <HeartHandshake size={28} color={colors.indigoink} />
          </View>
          <Text style={styles.title}>You've been invited as a guardian</Text>
          <Text style={styles.body}>
            Sign in or create an account, then we'll finish connecting you automatically — you won't need to re-enter the code.
          </Text>
          {code ? <Text style={styles.codePreview}>Code: {code}</Text> : null}
          <Pressable style={[styles.button, styles.primaryButton]} onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.primaryButtonText}>Log in</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/(auth)/register?purpose=guardian' as any)}>
            <Text style={styles.secondaryButtonText}>Create an account</Text>
          </Pressable>
        </Glass>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <ScreenHeader title="Guardian invite" subtitle="Connecting you as a guardian" />
      <Glass style={styles.card}>
        {status === 'accepting' && (
          <>
            <ActivityIndicator color={colors.indigoink} style={styles.loading} />
            <Text style={styles.body}>Accepting the invite…</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
              <Check size={28} color={colors.mintInk} />
            </View>
            <Text style={styles.title}>You're connected</Text>
            <Text style={styles.body}>
              {wardName
                ? `You'll be alerted if ${wardName} triggers Emergency SOS.`
                : "You'll be alerted if they trigger Emergency SOS."}
            </Text>
            <Pressable style={[styles.button, styles.primaryButton]} onPress={goToGuardianSection}>
              <Text style={styles.primaryButtonText}>View alerts</Text>
            </Pressable>
          </>
        )}

        {(status === 'error' || status === 'idle') && (
          <>
            <View style={[styles.iconCircle, status === 'error' && styles.iconCircleError]}>
              {status === 'error' ? <X size={28} color="#C0433E" /> : <ShieldCheck size={28} color={colors.indigoink} />}
            </View>
            <Text style={styles.title}>{status === 'error' ? 'Could not accept this invite' : 'Enter a guardian invite code'}</Text>
            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            <GlassInput
              label="Invite code"
              placeholder="e.g. ABCD1234"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
            />
            <Pressable
              style={[styles.button, styles.primaryButton, !code.trim() && styles.buttonDisabled]}
              disabled={!code.trim()}
              onPress={() => attemptAccept(code)}
            >
              <Text style={styles.primaryButtonText}>Accept invite</Text>
            </Pressable>
          </>
        )}
      </Glass>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: spacing.lg },
  card: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lavenderTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconCircleSuccess: {
    backgroundColor: colors.mintTint,
  },
  iconCircleError: {
    backgroundColor: 'rgba(192, 67, 62, 0.1)',
  },
  title: {
    ...typography.h2,
    fontSize: 19,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    textAlign: 'center',
    lineHeight: 20,
  },
  codePreview: {
    ...typography.caption,
    color: colors.mutedink,
    letterSpacing: 1,
  },
  errorText: {
    ...typography.caption,
    color: '#C0433E',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButton: {
    backgroundColor: colors.indigoink,
  },
  primaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.indigoink,
  },
});
