import { useEffect, useState } from "react";
import { Bell, AlertTriangle, FileText, Upload, Loader2 } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "../../services/notificationsService";

function iconFor(type: string) {
  if (type.includes("EMERGENCY")) return { icon: <AlertTriangle size={18} />, cls: "bg-destructive/15 text-destructive" };
  if (type.includes("EVIDENCE")) return { icon: <Upload size={18} />, cls: "bg-info/15 text-info" };
  return { icon: <FileText size={18} />, cls: "bg-primary/15 text-primary" };
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNotifications({ pageSize: 50 })
      .then((res) => setNotifications(res.items))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleClick = async (n: AppNotification) => {
    if (n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      await markNotificationRead(n.id);
    } catch {
      // best-effort
    }
  };

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // best-effort
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[800px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on new reports and activity</p>
        </div>
        <button onClick={handleMarkAll} className="text-sm text-primary hover:underline">
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading…
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <Bell size={28} className="opacity-40" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const { icon, cls } = iconFor(n.type);
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex gap-3 p-4 rounded-xl border transition cursor-pointer ${
                  !n.isRead
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card/60 border-border hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${cls}`}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
