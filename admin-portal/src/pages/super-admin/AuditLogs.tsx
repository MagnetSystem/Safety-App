import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, Loader2, ChevronLeft, ChevronRight, Building } from "lucide-react";
import { getAuditLogs } from "../../services/auditLogsService";
import { getOrganizations } from "../../services/organizationsService";
import { formatEnum } from "../../types/report";
import { useAuth } from "../../context/AuthContext";
import { queryKeys } from "../../lib/queryKeys";

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
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCollegeId, setSelectedCollegeId] = useState("");

  const { data: orgsData } = useQuery({
    queryKey: queryKeys.organizations.list({ pageSize: 100 }),
    queryFn: () => getOrganizations({ pageSize: 100 }),
    enabled: role === "support",
  });
  const colleges = orgsData?.items ?? [];

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.auditLogs.list(page, selectedCollegeId || undefined),
    queryFn: () => getAuditLogs({ page, pageSize: 20, collegeId: selectedCollegeId || undefined }),
    placeholderData: keepPreviousData,
  });
  const logs = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const error = isError ? "Could not load audit logs." : "";

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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs on this page..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        
        {role === 'support' && (
          <div className="relative max-w-[250px]">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCollegeId}
              onChange={(e) => {
                setSelectedCollegeId(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              <option value="">All Colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
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

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border border-border bg-card/60 rounded-xl px-4 py-3 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
