import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FileText, UserX, Bell, LifeBuoy, ShieldCheck, ChevronRight, Users } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, StatusPill, LoadingCards, EmptyState } from '../../src/components/ui-kit';
import { SOSButton } from '../../src/components/SOSButton';
import { Frost } from '../../src/components/GlassSurface';
import { colors, typography, glassSurface } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { getReports } from '../../src/services/incidentsService';
import { getMyProfile } from '../../src/services/membersService';
import { getNotifications } from '../../src/services/notificationsService';
import { listMyGuardians } from '../../src/services/guardiansService';
import { flushSos } from '../../src/services/pendingSos';
import { categoryLabel, type Report, type StudentProfile } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [guardians, setGuardians] = useState<Awaited<ReturnType<typeof listMyGuardians>> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [contextError, setContextError] = useState(false);
  const request = useRef(0);
  const load = useCallback(async (refresh = false) => {
    const current = ++request.current;
    if (refresh) setRefreshing(true);
    flushSos().catch(() => {});
    const [p, r, n, g] = await Promise.allSettled([
      getMyProfile(), getReports({ pageSize: 3 }),
      getNotifications({ unreadOnly: true, pageSize: 1 }), listMyGuardians(),
    ]);
    if (current !== request.current) return;
    if (p.status === 'fulfilled') setProfile(p.value);
    if (r.status === 'fulfilled') setReports(r.value.items);
    if (n.status === 'fulfilled') setUnreadCount(n.value.total);
    setGuardians(g.status === 'fulfilled' ? g.value : null);
    setReportError(r.status === 'rejected');
    setContextError(p.status === 'rejected' || g.status === 'rejected');
    setLoading(false);
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current += 1; };
  }, [load]));
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const inOrganization = !!(profile?.organizationId ?? profile?.college?.id ?? user?.organizationId);
  const connected = guardians?.filter(g => g.status === 'ACTIVE').length ?? 0;
  const pending = guardians?.some(g => g.status === 'PENDING');
  const guardianTitle = guardians === null ? (loading ? 'Checking your safety setup' : 'Connection status unavailable') : connected ? `${connected} guardian${connected > 1 ? 's' : ''} connected` : pending ? 'Guardian invite pending' : 'Connect someone you trust';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <Screen padded>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.mint} />}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>HERE FOR YOU, EVERY DAY</Text>
          <Text style={styles.name}>Hey, {firstName}.</Text><Text style={styles.greeting}>{greeting}. Make yourself at home.</Text>
          <Text style={styles.secondary}>{profile?.college?.name ?? profile?.organization?.name ?? 'Help, whenever you need it.'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} style={styles.bell} onPress={() => router.push('/notifications')}>
          <Frost /><Bell size={22} color={colors.ink} />
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </Pressable>
      </View>
      <Glass style={styles.hero}>
        <View pointerEvents="none" style={styles.orbitOne} /><View pointerEvents="none" style={styles.orbitTwo} />
        <View style={styles.heroHeading}><ShieldCheck size={18} color={colors.mintInk} /><Text style={styles.heroLabel}>EMERGENCY SUPPORT</Text></View>
        <Text style={styles.heroTitle}>Help is within reach.</Text>
        <SOSButton onArmed={() => router.push('/report/emergency')} />
        <Text style={styles.recipient}>{loading ? 'Checking alert recipients...' : contextError ? 'Recipient details unavailable. Check your safety setup below.' : inOrganization ? `Alerts your organization${connected ? ' and connected guardians' : ''}.` : connected ? 'Alerts your connected guardians.' : 'No guardian connected. Add one below to receive alerts.'}</Text>
      </Glass>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/profile', params: { section: 'guardian' } })} style={({ pressed }) => [styles.guardian, pressed && styles.pressed]}>
        <Frost /><View style={styles.icon}><Users size={22} color={colors.mintInk} /></View>
        <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{guardianTitle}</Text><Text style={styles.secondary}>{connected ? 'View your trusted circle' : pending ? 'They need to accept your invitation' : 'Manage your guardian setup'}</Text></View>
        <ChevronRight size={20} color={colors.mintInk} />
      </Pressable>
      {contextError && <Pressable accessibilityRole="button" onPress={() => void load(true)} style={styles.retry}><Text style={styles.link}>Refresh safety setup</Text></Pressable>}
      <Text style={styles.sectionTitle}>How can we help?</Text>
      {inOrganization ? <View style={styles.actions}>
        {[{ mode: 'normal', title: 'Report an issue', copy: 'Share with your organization', Icon: FileText, tint: colors.mintTint, ink: colors.mintInk }, { mode: 'anonymous', title: 'Anonymous report', copy: 'Report with your identity hidden', Icon: UserX, tint: colors.lavenderTint, ink: colors.lavender }].map(a => <Pressable key={a.mode} accessibilityRole="button" onPress={() => router.push({ pathname: '/report/new', params: { mode: a.mode } })} style={({ pressed }) => [styles.action, { backgroundColor: a.mode === 'normal' ? 'rgba(231,222,250,0.62)' : 'rgba(218,245,233,0.62)' }, pressed && styles.pressed]}>
          <Frost /><View style={[styles.icon, { backgroundColor: a.tint }]}><a.Icon size={22} color={a.ink} /></View><Text style={styles.cardTitle}>{a.title}</Text><Text style={styles.secondary}>{a.copy}</Text><ChevronRight size={18} color={a.ink} />
        </Pressable>)}
      </View> : <Glass><Text style={styles.secondary}>Join an organization to submit and track incident reports.</Text><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/profile', params: { section: 'org' } })} style={styles.retry}><Text style={styles.link}>Join your organization</Text></Pressable></Glass>}
      <Pressable accessibilityRole="button" onPress={() => router.push('/help')} style={({ pressed }) => [styles.support, pressed && styles.pressed]}><Frost /><LifeBuoy size={24} color={colors.mintInk} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>A little support goes a long way</Text><Text style={styles.secondary}>Helplines & someone to talk to</Text></View><ChevronRight size={18} color={colors.mintInk} /></Pressable>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Recent reports</Text><Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/reports')} style={styles.retry}><Text style={styles.link}>See all</Text></Pressable></View>
      {loading ? <LoadingCards /> : reportError ? <EmptyState title="Reports could not load" message="Please try again to see your latest updates." onRetry={() => void load(true)} /> : reports.length === 0 ? <EmptyState title="A space for your updates" message="Reports you submit will appear here. You can follow their progress at any time." /> : <View style={{ gap: 12 }}>{reports.map(r => <Pressable accessibilityRole="button" key={r.id} onPress={() => router.push(`/reports/${r.id}`)}><Glass style={{ gap: 10 }}><Text style={styles.cardTitle}>{categoryLabel(r.category)}</Text><Text style={styles.secondary}>{new Date(r.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text><StatusPill status={r.status} /></Glass></Pressable>)}</View>}
    </ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { ...typography.caption, fontSize: 10, letterSpacing: 1.2, color: colors.mintInk, marginBottom: 8 },
  name: { ...typography.h1, fontSize: 32, color: colors.ink },
  secondary: { ...typography.caption, color: colors.subink, marginTop: 4 },
  bell: { ...glassSurface, width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#B93836', borderRadius: 10, paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 12 },
  hero: { backgroundColor: 'rgba(255,255,255,0.44)', borderRadius: 32, padding: 22, alignItems: 'center', gap: 12, overflow: 'hidden' },
  heroHeading: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  heroTitle: { ...typography.h2, fontSize: 25, letterSpacing: -0.7, color: colors.ink, marginBottom: 2 },
  heroLabel: { ...typography.label, fontSize: 11, letterSpacing: 1.5, color: colors.mintInk },
  greeting: { ...typography.body, fontSize: 14, color: colors.subink, marginTop: 6 },
  orbitOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', top: -140, right: -100 },
  orbitTwo: { position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', bottom: -200, left: -130 },
  recipient: { ...typography.caption, color: colors.subink, textAlign: 'center', marginTop: 4 },
  sectionTitle: { ...typography.h2, fontSize: 19, color: colors.ink },
  guardian: { ...glassSurface, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24 },
  icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...typography.h3, fontSize: 16, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { ...glassSurface, flex: 1, minWidth: 140, padding: 16, borderRadius: 26, gap: 12 },
  support: { ...glassSurface, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,240,219,0.6)' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  retry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  link: { ...typography.label, color: colors.mintInk },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
