import QueryError from '../../components/QueryError';
import PasswordDialog from '../../components/PasswordDialog';
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Briefcase, CheckCircle2, FolderOpen, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import {
  activateStaff,
  deactivateStaff,
  getStaffById,
  resetStaffPassword,
} from "../../services/staffService";
import { getReports } from "../../services/incidentsService";
import { STATUS_TABS, formatEnum, type ComplaintStatus } from "../../types/report";
import { StatusBadge, PriorityBadge } from "../reports/ReportsList";
import { useAuth } from "../../context/auth";
import { queryKeys } from "../../lib/queryKeys";
import { reportPath } from "../../lib/paths";
import Pagination from "../../components/Pagination";
import TableSkeleton from "../../components/TableSkeleton";

const PAGE_SIZE = 10;
const CASE_STATUSES: ComplaintStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INVESTIGATING",
  "MORE_INFO_REQUESTED",
  "RESOLVED",
  "CLOSED",
];

function roleLabel(role?: string) {
  if (role === "OWNER") return "Owner";
  if (role === "ADMIN") return "Admin";
  return "Staff";
}

export default function StaffDetail() {
  const { id = "" } = useParams();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<ComplaintStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const staffQuery = useQuery({
    queryKey: queryKeys.staff.detail(id),
    queryFn: () => getStaffById(id),
    enabled: !!id,
  });
  const staff = staffQuery.data;
  const staffUserId = staff?.user.id ?? "";

  const status = filter === "All" ? undefined : filter;
  const casesQuery = useQuery({
    queryKey: queryKeys.reports.list({ status, page, pageSize: PAGE_SIZE, assignedToUserId: staffUserId }),
    queryFn: () => getReports({ status, page, pageSize: PAGE_SIZE, assignedToUserId: staffUserId }),
    enabled: !!staffUserId,
    placeholderData: keepPreviousData,
  });
  const cases = casesQuery.data?.items ?? [];
  const total = casesQuery.data?.total ?? 0;

  const countsQuery = useQuery({
    queryKey: queryKeys.staff.caseCounts(staffUserId),
    queryFn: async () => {
      const [all, ...perStatus] = await Promise.all([
        getReports({ assignedToUserId: staffUserId, page: 1, pageSize: 1 }),
        ...CASE_STATUSES.map((s) => getReports({ assignedToUserId: staffUserId, status: s, page: 1, pageSize: 1 })),
      ]);
      const byStatus = Object.fromEntries(CASE_STATUSES.map((s, i) => [s, perStatus[i].total])) as Record<ComplaintStatus, number>;
      return { assigned: all.total, byStatus };
    },
    enabled: !!staffUserId,
  });
  const solved = (countsQuery.data?.byStatus.RESOLVED ?? 0) + (countsQuery.data?.byStatus.CLOSED ?? 0);
  const assigned = countsQuery.data?.assigned ?? 0;
  const open = assigned - solved;

  const isSelf = staff?.user.id === user?.id;
  const canToggleStatus = staff?.orgRole !== "OWNER" && !isSelf;

  const toggleStatus = async () => {
    if (!staff || statusBusy || !canToggleStatus) return;
    if (staff.user.isActive && !window.confirm(`Suspend ${staff.name}?`)) return;
    setStatusBusy(true);
    setActionError("");
    try {
      if (staff.user.isActive) await deactivateStaff(staff.id);
      else await activateStaff(staff.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    } catch {
      setActionError("Could not update status.");
    } finally {
      setStatusBusy(false);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    setResetBusy(true);
    setResetError("");
    try {
      await resetStaffPassword(id, newPassword);
      setResetOpen(false);
    } catch {
      setResetError("Could not reset password.");
    } finally {
      setResetBusy(false);
    }
  };

  if (staffQuery.isLoading) {
    return (
      <div className="page-shell">
        <TableSkeleton />
      </div>
    );
  }

  if (staffQuery.isError || !staff) {
    return (
      <div className="page-shell">
        <QueryError message="Could not load this account." retry={() => staffQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Link to="/team" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to team
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{staff.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{roleLabel(staff.orgRole)}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${staff.user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {staff.user.isActive ? "Active" : "Suspended"}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {staff.user.email}</span>
              {staff.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {staff.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => { setResetError(""); setResetOpen(true); }}
            className="text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted"
          >
            Reset password
          </button>
          {canToggleStatus && (
            <button
              onClick={toggleStatus}
              disabled={statusBusy}
              className={`text-sm font-medium px-3 py-2 rounded-lg border inline-flex items-center gap-2 disabled:opacity-60 ${
                staff.user.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {statusBusy && <Loader2 size={14} className="animate-spin" />}
              {staff.user.isActive ? "Suspend" : "Activate"}
            </button>
          )}
        </div>
      </div>

      {actionError && <QueryError message={actionError} retry={() => setActionError("")} />}

      <p className="text-sm text-slate-500">
        Departments: {staff.departments?.length ? staff.departments.map((d) => d.department.name).join(", ") : "All"}
        {" · "}Added {new Date(staff.user.createdAt).toLocaleDateString()}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0"><FolderOpen size={18} /></div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Cases assigned</p>
            <p className="text-lg font-semibold text-slate-900">{countsQuery.isLoading ? "…" : assigned}</p>
          </div>
        </div>
        <div className="surface-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0"><CheckCircle2 size={18} /></div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Solved</p>
            <p className="text-lg font-semibold text-slate-900">{countsQuery.isLoading ? "…" : solved}</p>
          </div>
        </div>
        <div className="surface-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0"><ShieldCheck size={18} /></div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Still open</p>
            <p className="text-lg font-semibold text-slate-900">{countsQuery.isLoading ? "…" : open}</p>
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-4 sm:p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderOpen size={20} aria-hidden="true" /></span>
          <div>
            <h2 className="font-semibold">Assigned cases <span className="ml-1.5 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{casesQuery.isLoading ? "…" : total.toLocaleString()}</span></h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Cases assigned to {staff.name}</p>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pt-2 sm:px-5" aria-label="Filter cases by status">
          {STATUS_TABS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setFilter(s.value); setPage(1); }}
              aria-pressed={filter === s.value}
              className={`min-h-11 shrink-0 border-b-2 px-3 pb-3 pt-2 text-xs font-medium transition-colors sm:text-sm ${
                filter === s.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {casesQuery.isError ? (
          <div className="p-4"><QueryError message="Could not load cases." retry={() => casesQuery.refetch()} /></div>
        ) : casesQuery.isLoading ? (
          <TableSkeleton />
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {filter === "All" ? "No cases assigned yet." : `No ${formatEnum(filter).toLowerCase()} cases.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Case</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left font-medium px-4 py-3">Priority</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="max-w-xs px-5 py-4">
                      <Link to={reportPath(role, r.id)} className="font-mono text-xs font-semibold text-primary hover:underline">{r.code}</Link>
                      <p className="mt-1 font-medium">{formatEnum(r.category)}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={reportPath(role, r.id)} aria-label={`View case ${r.code}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-primary hover:bg-primary/5">
                        View <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!casesQuery.isLoading && !casesQuery.isError && (
          <div className="border-t border-border p-4"><Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} /></div>
        )}
      </div>

      <PasswordDialog
        open={resetOpen}
        title="Reset staff password"
        description={`Set a temporary password for ${staff.user.email}.`}
        submitting={resetBusy}
        error={resetError}
        onClose={() => setResetOpen(false)}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
