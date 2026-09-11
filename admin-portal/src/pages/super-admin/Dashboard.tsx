import QueryError from '../../components/QueryError';
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, UserCog, FileText,
  AlertTriangle, CheckCircle2, TrendingUp, Loader2,
} from "lucide-react";
import { getSuperAdminDashboard } from "../../services/dashboardService";
import { formatEnum } from "../../types/report";
import { queryKeys } from "../../lib/queryKeys";

export default function SuperAdminDashboard() {
  const { data, isLoading: loading, isError, refetch } = useQuery({
    queryKey: queryKeys.superAdminDashboard,
    queryFn: getSuperAdminDashboard,
  });
  const error = isError ? "Could not load platform dashboard." : "";

  const totalState = data?.byState.reduce((s, x) => s + x.count, 0) || 1;
  const maxMonth = Math.max(1, ...(data?.byMonth.map((m) => m.count) ?? [1]));
  const resolveRate =
    data && data.totalReports > 0 ? ((data.resolvedReports / data.totalReports) * 100).toFixed(1) : "0.0";
  const topColleges = [...(data?.byOrganization?.map(x => ({ collegeId: x.organizationId, college: x.organization, count: x.count })) ?? data?.byCollege ?? [])].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="page-shell">
      <div className="section-intro">
        <p className="page-overline">Platform</p>
        <h1>Every organization, one view.</h1>
        <p>A calm snapshot across tenants so support can see volume, emergencies, and resolution rate.</p>
      </div>

      {error && <QueryError message={error} retry={refetch} />}

      {isError && !data ? null : loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading dashboard…
        </div>
      ) : (
        <>
          {/* Key Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <StatCard title="Organizations" value={data?.totalOrganizations ?? data?.totalColleges ?? 0} icon={<Building2 className="h-5 w-5" />} />
            <StatCard title="Members" value={data?.totalMembers ?? data?.totalStudents ?? 0} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Staff" value={data?.totalStaff ?? data?.totalCollegeAdmins ?? 0} icon={<UserCog className="h-5 w-5" />} />
            <StatCard title="Total Reports" value={data?.totalReports ?? 0} icon={<FileText className="h-5 w-5" />} />
            <StatCard title="Emergency Reports" value={data?.emergencyReports ?? 0} icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
            <StatCard title="Resolved Cases" value={data?.resolvedReports ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} trend={`${resolveRate}% rate`} variant="success" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* State-wise */}
            <div className="surface-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Reports by State</h3>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {(data?.byState ?? []).length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {[...(data?.byState ?? [])].sort((a, b) => b.count - a.count).map((s) => (
                  <div key={s.state}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{s.state}</span>
                      <span className="font-medium">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/80" style={{ width: `${(s.count / totalState) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly */}
            <div className="surface-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Monthly Reports</h3>
                <span className="text-xs text-muted-foreground">Last 12 months</span>
              </div>
              <div className="flex items-end gap-2 h-44">
                {(data?.byMonth ?? []).length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {[...(data?.byMonth ?? [])].reverse().map((i) => (
                  <div key={i.month} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-primary/70 hover:bg-primary transition"
                      style={{ height: `${(i.count / maxMonth) * 100}%` }}
                    />
                    <span className="text-[11px] text-muted-foreground">{i.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Colleges + Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="surface-card p-5">
              <h3 className="font-medium mb-4">Top organizations by cases</h3>
              <div className="space-y-3">
                {topColleges.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {topColleges.map((c, i) => (
                  <div key={c.collegeId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-5">{i + 1}</span>
                      <span className="truncate">{c.college}</span>
                    </div>
                    <span className="font-medium bg-muted px-2 py-0.5 rounded-md">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-5">
              <h3 className="font-medium mb-4">Reports by Category</h3>
              <div className="space-y-3">
                {(data?.byCategory ?? []).length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {[...(data?.byCategory ?? [])].sort((a, b) => b.count - a.count).map((c) => (
                  <div key={c.category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatEnum(c.category)}</span>
                    <span className="font-medium">{c.count}</span>
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
    success: "text-success",
  };
  return (
    <div className="surface-card p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold mt-0.5">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-muted ${colorMap[variant]}`}>{icon}</div>
      </div>
      {trend && <p className="text-xs text-muted-foreground mt-2">{trend}</p>}
    </div>
  );
}
