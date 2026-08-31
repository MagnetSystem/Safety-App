import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, Easing, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FileText, UserX, Bell } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, StatusPill } from '../../src/components/ui-kit';
import { colors, radius, spacing, typography, gradients } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/store/AuthContext';
import { getReports } from '../../src/services/complaintsService';
import { getMyProfile } from '../../src/services/studentsService';
import { getNotifications } from '../../src/services/notificationsService';
import { categoryLabel, type Report, type StudentProfile } from '../../src/types';

function SOSButton() {
  const router = useRouter();
  const wave1 = React.useRef(new Animated.Value(0)).current;
  const wave2 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createWave = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createWave(wave1);
    const anim2 = createWave(wave2);

    anim1.start();
    const timer = setTimeout(() => {
      anim2.start();
    }, 1000);

    return () => {
      anim1.stop();
      anim2.stop();
      clearTimeout(timer);
    };
  }, []);

  const ringStyle = (animValue: Animated.Value) => ({
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.8], // RING_MAX_SCALE
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 0.6, 1],
      outputRange: [0.5, 0.2, 0],
    }),
  });

  return (
    <View style={styles.sosContainer}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.sosRing, { backgroundColor: '#e05c5c' }, ringStyle(wave1)]} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.sosRing, { backgroundColor: '#e05c5c' }, ringStyle(wave2)]} />

      <Pressable onPress={() => router.push('/report/emergency')} style={styles.sosBtnWrapper}>
        <LinearGradient colors={gradients.coral} locations={gradients.coralLocations} style={styles.sosGradient}>
          <Text style={styles.sosTitle}>SOS</Text>
          <Text style={styles.sosSubtitle}>Emergency</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
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

  return (
    <Screen padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Good to see you,</Text>
              <Text style={styles.name}>{firstName}</Text>
              <Text style={styles.college}>{profile?.college?.name ?? ' '}</Text>
            </View>
            <Pressable style={styles.bellButton} onPress={() => router.push('/notifications' as any)}>
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
          <SOSButton />
        </View>

        <View style={styles.actionGrid}>
          <Pressable style={styles.actionCard} onPress={() => router.push({ pathname: '/report/new', params: { mode: 'normal' } })}>
            <Glass style={styles.actionGlass}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.mintTint }]}>
                <FileText size={20} strokeWidth={1.8} color={colors.mint} />
              </View>
              <Text style={styles.actionTitle}>Normal report</Text>
              <Text style={styles.actionSubtitle}>Filed with your name attached</Text>
            </Glass>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push({ pathname: '/report/new', params: { mode: 'anonymous' } })}>
            <Glass style={styles.actionGlass}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.lavenderTint }]}>
                <UserX size={20} strokeWidth={1.8} color={colors.lavender} />
              </View>
              <Text style={styles.actionTitle}>Anonymous report</Text>
              <Text style={styles.actionSubtitle}>Nobody sees who you are</Text>
            </Glass>
          </Pressable>
        </View>

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
              <Text style={styles.emptyText}>You have not filed any reports yet.</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
    marginBottom: 64,
    zIndex: -1,
  },
  sosContainer: {
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sosRing: {
    borderRadius: 88,
  },
  sosBtnWrapper: {
    width: 144,
    height: 144,
    borderRadius: 72,
    overflow: 'hidden',
    shadowColor: '#E0605C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 24,
  },
  sosGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 30,
    letterSpacing: -0.5,
    color: '#FFF',
  },
  sosSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 36,
  },
  actionCard: {
    flex: 1,
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
