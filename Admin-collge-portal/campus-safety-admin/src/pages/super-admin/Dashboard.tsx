import { useEffect, useState } from "react";
import {
  Building2, Users, UserCog, FileText,
  AlertTriangle, CheckCircle2, TrendingUp, Loader2,
} from "lucide-react";
import { getSuperAdminDashboard, type SuperAdminDashboard } from "../../services/dashboardService";
import { formatEnum } from "../../types/report";

export default function SuperAdminDashboard() {
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSuperAdminDashboard()
      .then(setData)
      .catch(() => setError("Could not load platform dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const totalState = data?.byState.reduce((s, x) => s + x.count, 0) || 1;
  const maxMonth = Math.max(1, ...(data?.byMonth.map((m) => m.count) ?? [1]));
  const resolveRate =
    data && data.totalReports > 0 ? ((data.resolvedReports / data.totalReports) * 100).toFixed(1) : "0.0";
  const topColleges = [...(data?.byCollege ?? [])].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview across all colleges
        </p>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading dashboard…
        </div>
      ) : (
        <>
          {/* Key Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <StatCard title="Total Colleges" value={data?.totalColleges ?? 0} icon={<Building2 className="h-5 w-5" />} />
            <StatCard title="Registered Students" value={data?.totalStudents ?? 0} icon={<Users className="h-5 w-5" />} />
            <StatCard title="College Admins" value={data?.totalCollegeAdmins ?? 0} icon={<UserCog className="h-5 w-5" />} />
            <StatCard title="Total Reports" value={data?.totalReports ?? 0} icon={<FileText className="h-5 w-5" />} />
            <StatCard title="Emergency Reports" value={data?.emergencyReports ?? 0} icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
            <StatCard title="Resolved Cases" value={data?.resolvedReports ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} trend={`${resolveRate}% rate`} variant="success" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* State-wise */}
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
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
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Monthly Reports</h3>
                <span className="text-xs text-muted-foreground">Last 12 months</span>
              </div>
              <div className="flex items-end gap-2 h-44">
                {(data?.byMonth ?? []).length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {[...(data?.byMonth ?? [])].reverse().map((i) => (
                  <div key={i.month} className="flex-1 flex flex-col items-center gap-1">
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
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
              <h3 className="font-medium mb-4">Top Colleges by Reports</h3>
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

            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
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

function StatCard({ title, value, icon, trend, variant = "default" }: any) {
  const colorMap: any = {
    default: "text-primary",
    destructive: "text-destructive",
    success: "text-success",
  };
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4">
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
