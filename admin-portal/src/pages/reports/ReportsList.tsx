import QueryError from '../../components/QueryError';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Download, FolderOpen, Search, ShieldCheck, X } from "lucide-react";
import { getReportById, getReports } from "../../services/incidentsService";
import { formatEnum, type ComplaintStatus, type Report } from "../../types/report";
import { queryKeys } from "../../lib/queryKeys";
import { useAuth } from "../../context/auth";
import { reportPath } from "../../lib/paths";
import Pagination from "../../components/Pagination";
import TableSkeleton from "../../components/TableSkeleton";

const PAGE_SIZE = 20;

function toCsv(rows: Report[]): string {
  const header = ["Code", "Type", "Category", "Reporter", "Status", "Priority", "Created", "Location"];
  const esc = (value: unknown) => {
    const text = String(value ?? "");
    const safeText = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const lines = rows.map((r) =>
    [
      r.code,
      formatEnum(r.type),
      formatEnum(r.category),
      r.reporterLabel ?? "Anonymous",
      formatEnum(r.status),
      formatEnum(r.priority),
      new Date(r.createdAt).toISOString(),
      r.location ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [header.join(","), ...lines].join("\r\n");
}

function downloadCsv(rows: Report[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ComplaintStatus | "All">("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const status = filter === "All" ? undefined : filter;
  const { data, isLoading: loading, isError, isFetching, refetch } = useQuery({
    queryKey: queryKeys.reports.list({ status, search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    queryFn: () => getReports({ status, search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const reports = data?.items ?? [];
  const total = data?.total ?? 0;
  const error = isError ? "Could not load reports." : "";

  const prefetch = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.reports.detail(id),
      queryFn: () => getReportById(id),
    });
  };

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="section-intro border-0 p-0">
          <p className="page-overline">Case management</p>
          <h1>Every case deserves care.</h1>
          <p>Review reports, coordinate your team, and help people move forward.</p>
        </div>
        <button
          onClick={() => downloadCsv(reports)}
          disabled={isFetching || reports.length === 0}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <Download size={15} /> Export this page
        </button>
      </div>

      <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderOpen size={20} aria-hidden="true" /></span>
          <div>
            <h2 className="font-semibold">Cases <span className="ml-1.5 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{loading ? "…" : total.toLocaleString()}</span></h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{filter === "All" ? "Your organization's case queue" : `${formatEnum(filter)} cases`}</p>
          </div>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search cases</span>
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 text-muted-foreground" />
          <input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search code or description…" className="min-h-11 w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm" />
        </label>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pt-2 sm:px-5" aria-label="Filter cases by status">
        {STATUS_TABS.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setFilter(s.value);
              setPage(1);
            }}
            aria-pressed={filter === s.value}
            className={`min-h-11 shrink-0 border-b-2 px-3 pb-3 pt-2 text-xs font-medium transition-colors sm:text-sm ${
              filter === s.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <div className="p-4"><QueryError message={error} retry={refetch} /></div>}

      <div aria-busy={isFetching} className={isFetching ? "opacity-75 transition-opacity" : ""}>
        {isError && !data ? null : loading ? (
          <TableSkeleton />
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck size={26} aria-hidden="true" /></span>
            <h3 className="font-semibold">{search || filter !== "All" ? "No cases match these filters" : "Your case queue is clear"}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{search || filter !== "All" ? "Try another search or status to find the case you need." : "New reports will appear here so your team can review them and offer support."}</p>
            {(search || filter !== "All") && <button onClick={() => { setSearch(""); setFilter("All"); setPage(1); }} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium"><X size={15} /> Clear filters</button>}
          </div>
        ) : (
          <>
          <div className="divide-y divide-border md:hidden">
            {reports.map(report => (
              <Link key={report.id} to={reportPath(role, report.id)} onFocus={() => prefetch(report.id)} className="block p-4 transition-colors hover:bg-muted/40">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-sm font-semibold text-primary">{report.code}</span><PriorityBadge priority={report.priority} /></div>
                <h3 className="mt-2 text-sm font-semibold">{formatEnum(report.category)}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{report.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><StatusBadge status={report.status} /><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}<ArrowUpRight size={16} aria-hidden="true" /></span></div>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Organization cases and their current status</caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Case</th>
                  <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">Reporter</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left font-medium px-4 py-3">Priority</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="max-w-xs px-5 py-4"><Link to={reportPath(role, r.id)} onMouseEnter={() => prefetch(r.id)} onFocus={() => prefetch(r.id)} className="font-mono text-xs font-semibold text-primary hover:underline">{r.code}</Link><p className="mt-1 font-medium">{formatEnum(r.category)}</p><p className="mt-1 line-clamp-1 max-w-xs text-xs text-muted-foreground">{r.description}</p></td>
                    <td className="px-4 py-3 hidden xl:table-cell">{r.reporterLabel ?? "Anonymous"}<p className="mt-1 text-xs text-muted-foreground">{formatEnum(r.type)}</p></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={reportPath(role, r.id)}
                        onMouseEnter={() => prefetch(r.id)}
                        onFocus={() => prefetch(r.id)}
                        aria-label={`View case ${r.code}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-primary hover:bg-primary/5"
                      >
                        View <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {!loading && !isError && <div className="border-t border-border p-4"><Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} /></div>}
      </div>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><ShieldCheck size={14} className="shrink-0" aria-hidden="true" />Handle case information with care. Export only when needed.</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: "bg-amber-50 text-amber-800",
    UNDER_REVIEW: "bg-sky-50 text-sky-800",
    INVESTIGATING: "bg-blue-50 text-blue-800",
    MORE_INFO_REQUESTED: "bg-amber-50 text-amber-800",
    RESOLVED: "bg-emerald-50 text-emerald-800",
    CLOSED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${map[status] || "bg-muted"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {formatEnum(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-50 text-red-800",
    HIGH: "bg-amber-50 text-amber-800",
    NORMAL: "bg-slate-100 text-slate-600",
    LOW: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${map[priority] || "bg-muted"}`}>
      {formatEnum(priority)}
    </span>
  );
}
