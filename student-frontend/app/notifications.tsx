import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../src/components/PhoneFrame';
import { Glass, ScreenHeader } from '../src/components/ui-kit';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../src/services/notificationsService';

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    getNotifications({ pageSize: 50 })
      .then((data) => setItems(data.items))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePress = async (notification: AppNotification) => {
    if (notification.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(notification.id);
    } catch {
      // best-effort — a manual refresh will resync
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  };

  const hasUnread = items.some((n) => !n.isRead);

  return (
    <Screen padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.indigoink} />}
      >
        <ScreenHeader title="Notifications" subtitle="Updates on your reports" back="/(tabs)/home" />

        {hasUnread && (
          <Pressable onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </Pressable>
        )}

        {loading ? (
          <ActivityIndicator color={colors.indigoink} style={styles.loading} />
        ) : items.length === 0 ? (
          <Glass style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nothing yet. You will see updates here when your reports change status.</Text>
          </Glass>
        ) : (
          <View style={styles.list}>
            {items.map((n) => (
              <Pressable key={n.id} onPress={() => handlePress(n)}>
                <Glass style={n.isRead ? styles.card : [styles.card, styles.cardUnread]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    {!n.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardBody}>{n.body}</Text>
                  <Text style={styles.cardDate}>{new Date(n.createdAt).toLocaleString()}</Text>
                </Glass>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  markAll: {
    ...typography.caption,
    color: colors.indigoink,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  emptyCard: {
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedink,
    lineHeight: 20,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  cardUnread: {
    borderColor: 'rgba(91, 110, 232, 0.35)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.h3,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.indigoink,
  },
  cardBody: {
    ...typography.body,
    fontSize: 13,
    color: colors.subink,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  cardDate: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: spacing.sm,
  },
});
