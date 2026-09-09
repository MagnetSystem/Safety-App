import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Shield, UserCog, X } from "lucide-react";
import {
  activateStaff,
  createStaff,
  deactivateStaff,
  getStaff,
  resetStaffPassword,
  type CreateStaffInput,
} from "../../services/staffService";
import { getDepartments } from "../../services/departmentsService";
import { useAuth } from "../../context/AuthContext";
import type { OrgRole, StaffMember } from "../../types/organization";
import { canAddOrgAdmins, canManageOrgTeam } from "../../types/user";
import { queryKeys } from "../../lib/queryKeys";
import type { Paginated } from "../../types/report";
import Pagination from "../../components/Pagination";
import TableSkeleton from "../../components/TableSkeleton";
import PasswordDialog from "../../components/PasswordDialog";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  orgRole: "STAFF" as "ADMIN" | "STAFF",
  departmentIds: [] as string[],
};

function roleLabel(role?: OrgRole | string) {
  if (role === "OWNER") return "Owner";
  if (role === "ADMIN") return "Admin";
  return "Staff";
}

export default function Team() {
  const { user, role } = useAuth();
  const canAddAdmin = canAddOrgAdmins(role);
  const canManage = canManageOrgTeam(role);

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const staffKey = queryKeys.staff.list({ page, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: staffKey,
    queryFn: () => getStaff({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const error = actionError || (isError ? "Could not load team members." : "");

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => getDepartments().catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || "Could not create the account.");
    },
  });
  const submitting = createMutation.isPending;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!canManage) return;
    if (form.orgRole === "ADMIN" && !canAddAdmin) {
      setFormError("Only the owner can add admins.");
      return;
    }
    const payload: CreateStaffInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      orgRole: form.orgRole,
      departmentIds: form.departmentIds.length ? form.departmentIds : undefined,
    };
    createMutation.mutate(payload);
  };

  const toggleStatus = async (member: StaffMember) => {
    if (member.orgRole === "OWNER") return;
    const wasActive = member.user.isActive;
    queryClient.setQueryData<Paginated<StaffMember>>(staffKey, (old) =>
      old
        ? {
            ...old,
            items: old.items.map((x) =>
              x.id === member.id ? { ...x, user: { ...x.user, isActive: !wasActive } } : x,
            ),
          }
        : old,
    );
    try {
      if (wasActive) await deactivateStaff(member.id);
      else await activateStaff(member.id);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Could not update status.");
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetTarget) return;
    setResetBusy(true);
    setResetError("");
    try {
      await resetStaffPassword(resetTarget.id, newPassword);
      setResetTarget(null);
    } catch {
      setResetError("Could not reset password.");
    } finally {
      setResetBusy(false);
    }
  };

  const filtered = items.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      roleLabel(m.orgRole).toLowerCase().includes(q)
    );
  });

  if (!canManage) {
    return (
      <div className="page-shell">
        <p className="text-sm text-slate-500">Only owners and admins can manage the team.</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Organization</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Admins & Staff</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Add admins and staff for {user?.organizationName || "your organization"}. Admins can manage cases and staff;
            staff handle assigned cases.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} />
          Add {canAddAdmin ? "admin or staff" : "staff"}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <div className="surface-card overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No team members yet. Add an admin or staff account to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-border">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Departments</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          {m.orgRole === "OWNER" ? <Shield size={16} /> : <UserCog size={16} />}
                        </div>
                        <span className="font-medium text-slate-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-slate-500">{m.user.email}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {roleLabel(m.orgRole)}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-slate-500">
                      {m.departments?.length
                        ? m.departments.map((d) => d.department.name).join(", ")
                        : "All"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {m.user.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      {m.orgRole !== "OWNER" && (
                        <>
                          <button
                            onClick={() => {
                              setResetError("");
                              setResetTarget(m);
                            }}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted"
                          >
                            Reset password
                          </button>
                          <button
                            onClick={() => toggleStatus(m)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                              m.user.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {m.user.isActive ? "Suspend" : "Activate"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <PasswordDialog
        open={!!resetTarget}
        title="Reset staff password"
        description={resetTarget ? `Set a temporary password for ${resetTarget.user.email}.` : undefined}
        submitting={resetBusy}
        error={resetError}
        onClose={() => setResetTarget(null)}
        onSubmit={handleResetPassword}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl bg-white border border-border shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add team member</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              They sign in on this portal with the email and temporary password you set.
            </p>

            {formError && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{formError}</div>
            )}

            <label className="block text-sm">
              Name
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm"
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Temporary password
                <input
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm"
                />
              </label>
              <label className="block text-sm">
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm"
                />
              </label>
            </div>
            <label className="block text-sm">
              Role
              <select
                value={form.orgRole}
                onChange={(e) => setForm({ ...form, orgRole: e.target.value as "ADMIN" | "STAFF" })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm bg-white"
              >
                <option value="STAFF">Staff — handles assigned cases</option>
                {canAddAdmin && <option value="ADMIN">Admin — manages staff and organization settings</option>}
              </select>
            </label>
            {departments.length > 0 && (
              <fieldset className="text-sm space-y-2">
                <legend className="font-medium text-slate-700">Departments (optional)</legend>
                <p className="text-xs text-slate-400">Leave empty to see the whole organization queue.</p>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {departments.map((d) => {
                    const checked = form.departmentIds.includes(d.id);
                    return (
                      <label key={d.id} className="flex items-center gap-2 border rounded-xl px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              departmentIds: checked
                                ? form.departmentIds.filter((id) => id !== d.id)
                                : [...form.departmentIds, d.id],
                            })
                          }
                        />
                        {d.name}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Creating…" : `Create ${form.orgRole === "ADMIN" ? "admin" : "staff"}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
