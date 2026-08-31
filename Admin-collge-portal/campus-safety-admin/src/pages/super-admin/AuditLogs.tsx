import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { getAuditLogs, type AuditLogEntry } from "../../services/auditLogsService";
import { formatEnum } from "../../types/report";

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

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAuditLogs({ pageSize: 100 })
      .then((res) => setLogs(res.items))
      .catch(() => setError("Could not load audit logs."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.actor?.email.toLowerCase().includes(q) ||
      l.college?.name.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Immutable record of sensitive actions across the platform
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading logs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No audit log entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Action</th>
                  <th className="text-left font-medium px-4 py-3">Actor</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Entity</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">College</th>
                  <th className="text-left font-medium px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{formatEnum(l.action)}</td>
                    <td className="px-4 py-3">{l.actor?.email ?? "System"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{l.college?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{timeAgo(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
