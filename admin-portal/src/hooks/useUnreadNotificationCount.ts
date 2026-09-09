import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getNotifications } from "../services/notificationsService";

export function useUnreadNotificationCount() {
  const { data } = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => getNotifications({ unreadOnly: true, pageSize: 1 }),
    refetchInterval: 30_000,
  });
  return data?.total ?? 0;
}
