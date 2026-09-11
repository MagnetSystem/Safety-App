import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Screen } from '../../src/components/PhoneFrame';
import { Glass, ScreenHeader, StatusPill, LoadingCards, EmptyState } from '../../src/components/ui-kit';
import { getReports } from '../../src/services/incidentsService';
import { categoryLabel, type Report } from '../../src/types';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

const PAGE_SIZE = 20;

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    getReports({ page: 1, pageSize: PAGE_SIZE })
      .then((data) => {
        setReports(data.items);
        setTotal(data.total);
        setPage(1);
        setError(null);
      })
      .catch(() => setError('Could not load your reports.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || refreshing || reports.length >= total) return;
    setLoadingMore(true);
    const next = page + 1;
    getReports({ page: next, pageSize: PAGE_SIZE })
      .then((data) => {
        setReports((prev) => [...prev, ...data.items]);
        setPage(next);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, refreshing, reports.length, total, page]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen padded>
      <FlatList
        data={loading || error ? [] : reports}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.indigoink} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <ScreenHeader
            title="My reports"
            subtitle="Everything you have filed, and where it stands"
          />
        }
        ListEmptyComponent={
          loading ? (
            <LoadingCards />
          ) : (
            <EmptyState title={error ? 'Reports could not load' : 'Your reports, in one place'} message={error ?? 'When you submit a report, its updates and conversation will appear here.'} onRetry={error ? () => load(true) : undefined} />
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.indigoink} style={styles.footerLoading} /> : null
        }
        renderItem={({ item: r }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/reports/${r.id}`)} style={styles.cardWrap}>
            <Glass style={styles.card}>
              <View style={styles.content}>
                <View style={styles.info}>
                  <View style={[styles.typeBadge, { backgroundColor: r.type === 'ANONYMOUS' ? colors.lavenderTint : colors.mintTint }]}>
                    <Text style={[styles.typeText, { color: r.type === 'ANONYMOUS' ? colors.lavender : colors.mintInk }]}>
                      {r.type === 'ANONYMOUS' ? 'Anonymous' : r.type === 'EMERGENCY' ? 'Emergency' : 'Named report'}
                    </Text>
                  </View>
                  <Text style={styles.category} numberOfLines={2}>
                    {categoryLabel(r.category)}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(r.createdAt).toLocaleDateString()} · {r.code}
                  </Text>
                </View>
                <Text style={styles.meta}>{r.timeline?.length ? `Updated ${new Date(Math.max(...r.timeline.map(t => new Date(t.createdAt).getTime()))).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'Awaiting an update'}</Text>
                <View style={styles.statusSection}>
                  <StatusPill status={r.status} />
                  <ChevronRight size={16} color={colors.mutedink} style={styles.chevron} />
                </View>
              </View>
            </Glass>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  footerLoading: {
    marginVertical: spacing.lg,
  },
  emptyCard: {
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedink,
  },
  cardWrap: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: {
    ...typography.caption,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  category: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: 4,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  chevron: {
    marginLeft: 4,
  },
});
