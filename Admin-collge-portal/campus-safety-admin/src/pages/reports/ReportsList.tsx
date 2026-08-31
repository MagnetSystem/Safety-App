import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Eye } from "lucide-react";
import { getReports } from "../../services/complaintsService";
import { formatEnum, type ComplaintStatus, type Report } from "../../types/report";

const STATUS_TABS: { label: string; value: ComplaintStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Investigating", value: "INVESTIGATING" },
  { label: "More Info", value: "MORE_INFO_REQUESTED" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

export default function ReportsList() {
  const [filter, setFilter] = useState<ComplaintStatus | "All">("All");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getReports({ status: filter === "All" ? undefined : filter, pageSize: 50 })
      .then((res) => setReports(res.items))
      .catch(() => setError("Could not load reports."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Manage and act on all college reports</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === s.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Code</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left font-medium px-4 py-3">Student</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left font-medium px-4 py-3">Priority</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{r.code}</td>
                    <td className="px-4 py-3">{formatEnum(r.type)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{formatEnum(r.category)}</td>
                    <td className="px-4 py-3">{r.reporterLabel ?? "Anonymous Student"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/reports/${r.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Eye size={15} /> View
                      </Link>
                    </td>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: "bg-warning/15 text-warning",
    UNDER_REVIEW: "bg-info/15 text-info",
    INVESTIGATING: "bg-info/15 text-info",
    MORE_INFO_REQUESTED: "bg-warning/15 text-warning",
    RESOLVED: "bg-success/15 text-success",
    CLOSED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${map[status] || "bg-muted"}`}>
      {formatEnum(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-destructive/15 text-destructive",
    HIGH: "bg-warning/15 text-warning",
    NORMAL: "bg-info/15 text-info",
    LOW: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[priority] || "bg-muted"}`}>
      {formatEnum(priority)}
    </span>
  );
}
