import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FileText, UserX, Bell, LifeBuoy } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, StatusPill } from '../../src/components/ui-kit';
import { SOSButton } from '../../src/components/SOSButton';
import { colors, spacing, typography } from '../../src/constants/theme';
import { useAuth } from '../../src/store/AuthContext';
import { getReports } from '../../src/services/incidentsService';
import { getMyProfile } from '../../src/services/membersService';
import { getNotifications } from '../../src/services/notificationsService';
import { flushSos } from '../../src/services/pendingSos';
import { categoryLabel, type Report, type StudentProfile } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    flushSos().catch(() => {});
    Promise.all([
      getMyProfile().catch(() => null),
      getReports({ pageSize: 3 }).catch(() => ({ items: [] as Report[] })),
      getNotifications({ unreadOnly: true, pageSize: 1 }).catch(() => ({ total: 0 })),
    ]).then(([profileData, reportsData, notificationsData]) => {
      setProfile(profileData);
      setReports(reportsData.items);
      setUnreadCount('total' in notificationsData ? notificationsData.total : 0);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const firstName = (profile?.name ?? user?.email ?? 'there').split(' ')[0];
  const inOrganization = !!(profile?.organizationId ?? profile?.college?.id ?? user?.organizationId);

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.greeting}>Good to see you,</Text>
              <Text style={styles.name}>{firstName}</Text>
              <Text style={styles.college}>{profile?.college?.name ?? profile?.organization?.name ?? (inOrganization ? ' ' : 'Personal safety')}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'} style={styles.bellButton} onPress={() => router.push('/notifications' as any)}>
              <Glass style={styles.bellGlass}>
                <Bell size={18} strokeWidth={1.8} color={colors.ink} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </Glass>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroSection}>
          <SOSButton onArmed={() => router.push('/report/emergency')} />
        </View>

        {inOrganization ? (
        <View style={styles.actionGrid}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]} onPress={() => router.push({ pathname: '/report/new', params: { mode: 'normal' } })}>
            <Glass style={styles.actionGlass}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.mintTint }]}>
                <FileText size={20} strokeWidth={1.8} color={colors.mint} />
              </View>
              <Text style={styles.actionTitle}>Report an issue</Text>
              <Text style={styles.actionSubtitle}>Send a report with your name</Text>
            </Glass>
          </Pressable>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]} onPress={() => router.push({ pathname: '/report/new', params: { mode: 'anonymous' } })}>
            <Glass style={styles.actionGlass}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.lavenderTint }]}>
                <UserX size={20} strokeWidth={1.8} color={colors.lavender} />
              </View>
              <Text style={styles.actionTitle}>Anonymous report</Text>
              <Text style={styles.actionSubtitle}>Submit without showing your name</Text>
            </Glass>
          </Pressable>
        </View>
        ) : (
          <Glass style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You are using the app on your own. Emergency SOS alerts your Guardian. Join an organization from Profile to file reports.
            </Text>
          </Glass>
        )}

        <View style={styles.reportsSection}>
          <View style={styles.reportsHeader}>
            <Text style={styles.reportsTitle}>Recent reports</Text>
            <Pressable onPress={() => router.push('/(tabs)/reports')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.indigoink} style={styles.loading} />
          ) : reports.length === 0 ? (
            <Glass style={styles.emptyCard}>
              <Text style={styles.emptyText}>No reports yet. Reports you submit will appear here so you can follow their progress.</Text>
            </Glass>
          ) : (
            <View style={styles.reportList}>
              {reports.map((r) => (
                <Pressable key={r.id} onPress={() => router.push(`/reports/${r.id}`)}>
                  <Glass style={styles.reportCard}>
                    <View style={styles.reportCardLeft}>
                      <Text style={styles.reportCategory} numberOfLines={1}>{categoryLabel(r.category)}</Text>
                      <Text style={styles.reportDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <StatusPill status={r.status} />
                  </Glass>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Pressable style={styles.helpLink} onPress={() => router.push('/help' as any)}>
          <LifeBuoy size={14} strokeWidth={1.8} color={colors.indigoink} />
          <Text style={styles.helpLinkText}>Helplines &amp; someone to talk to</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
  },
  name: {
    ...typography.h1,
    color: colors.ink,
    marginTop: 2,
  },
  college: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: 4,
  },
  bellButton: {
    marginTop: 2,
  },
  bellGlass: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  bellBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E0605C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 36,
    zIndex: 1,
  },
  helpLink: {
    minHeight: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#DDF3EE',
  },
  helpLinkText: {
    ...typography.caption,
    color: colors.indigoink,
    fontFamily: 'Inter_500Medium',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: 36,
  },
  actionCard: {
    flex: 1,
    minWidth: 140,
  },
  actionGlass: {
    padding: spacing.lg,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.subink,
    marginTop: 4,
    lineHeight: 18,
  },
  reportsSection: {},
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reportsTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  seeAll: {
    ...typography.caption,
    color: colors.indigoink,
  },
  loading: {
    marginTop: spacing.lg,
  },
  emptyCard: {
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedink,
  },
  reportList: {
    gap: spacing.md,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  reportCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  reportCategory: {
    ...typography.h3,
    color: colors.ink,
  },
  reportDate: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: 4,
  },
});
