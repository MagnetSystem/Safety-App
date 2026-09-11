import QueryError from '../../components/QueryError';
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Clock, CheckCircle2, FileText,
  Search, Users, Loader2,
} from "lucide-react";
import { getOrgDashboard } from "../../services/dashboardService";
import { formatEnum } from "../../types/report";
import { queryKeys } from "../../lib/queryKeys";

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data, isLoading: loading, isError, refetch } = useQuery({
    queryKey: queryKeys.orgDashboard,
    queryFn: getOrgDashboard,
  });
  const error = isError ? "Could not load dashboard data." : "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const maxMonth = Math.max(1, ...(data?.byMonth.map((m) => m.count) ?? [1]));
  const totalForDept = data?.byDepartment.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="section-intro border-0 p-0">
          <p className="page-overline">Overview</p>
          <h1>Care in motion.</h1>
          <p>A calm snapshot of cases in your organization, so the next action is obvious.</p>
        </div>
        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm"
          />
        </form>
      </div>

      {error && <QueryError message={error} retry={refetch} />}

      {isError && !data ? null : loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading dashboard…
        </div>
      ) : (
        <>
          {/* Key Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard title="Today's Reports" value={data?.todayReports ?? 0} icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />} trend="Since midnight" />
            <StatCard title="Emergency" value={data?.emergencyReports ?? 0} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} trend="Immediate" variant="destructive" />
            <StatCard title="Pending" value={data?.pending ?? 0} icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />} trend="Awaiting action" variant="warning" />
            <StatCard title="Investigating" value={data?.investigating ?? 0} icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} trend="In progress" variant="info" />
            <StatCard title="Resolved" value={data?.resolved ?? 0} icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />} trend="All time" variant="success" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* By Department */}
            <div className="surface-card p-4 sm:p-5">
              <h3 className="font-medium text-foreground mb-4">By Department</h3>
              <div className="space-y-3">
                {(data?.byDepartment ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
                {(data?.byDepartment ?? []).map((d) => (
                  <div key={d.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground truncate">{d.department}</span>
                      <span className="font-medium">{d.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/80" style={{ width: `${(d.count / totalForDept) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Month */}
            <div className="surface-card p-4 sm:p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-foreground">By Month</h3>
                <span className="text-xs text-muted-foreground">Last 12 months</span>
              </div>
              <div className="flex items-end gap-1.5 sm:gap-2 h-36 sm:h-40">
                {(data?.byMonth ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
                {[...(data?.byMonth ?? [])].reverse().map((m) => (
                  <div key={m.month} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-primary/70"
                      style={{ height: `${(m.count / maxMonth) * 100}%` }}
                    />
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground">{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Category */}
            <div className="surface-card p-4 sm:p-5">
              <h3 className="font-medium text-foreground mb-4">By Category</h3>
              <div className="space-y-2.5">
                {(data?.byCategory ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
                {(data?.byCategory ?? []).map((c) => (
                  <div key={c.category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate">{formatEnum(c.category)}</span>
                    <span className="font-medium bg-muted px-2 py-0.5 rounded-md">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, variant = "default" }: { title: string; value: number; icon: ReactNode; trend?: string; variant?: string }) {
  const colorMap: Record<string, string> = {
    default: "text-primary",
    destructive: "text-destructive",
    warning: "text-warning",
    info: "text-info",
    success: "text-success",
  };
  const color = colorMap[variant];

  return (
    <div className="surface-card p-3 sm:p-4">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold mt-0.5">{value}</p>
        </div>
        <div className={`p-1.5 sm:p-2 rounded-lg bg-muted ${color}`}>{icon}</div>
      </div>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-2">{trend}</p>
    </div>
  );
}
