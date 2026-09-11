import QueryError from '../../components/QueryError';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Building2, Loader2, X, KeyRound } from "lucide-react";
import {
  getOrganizations,
  createOrganization,
  updateOrganizationStatus,
  getOrganization,
  resetOwnerPassword,
  type CreateOrganizationInput,
} from "../../services/organizationsService";
import { getIndustryCatalog, type IndustryCatalog } from "../../services/departmentsService";
import { onboardClient } from "../../services/organizationTypesService";
import type { Organization } from "../../types/organization";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { queryKeys } from "../../lib/queryKeys";


type OrgDetail = Organization & {
  joinCode?: string;
  contactName?: string | null;
  departments?: { id: string; name: string; slug: string; isDefault?: boolean }[];
  staff?: { id: string; name: string; phone: string | null; user: { id: string; email: string; isActive: boolean } }[];
  organizationType?: { id: string; slug: string; label: string; blurb?: string } | null;
  _count?: { members?: number; staff?: number; incidents?: number; departments?: number; students?: number; admins?: number };
};

const EMPTY_FORM: CreateOrganizationInput & { ownerName: string; ownerEmail: string; ownerPassword: string } = {
  name: "", code: "", state: "", district: "", principal: "", phone: "", email: "", industry: "EDUCATION",
  ownerName: "", ownerEmail: "", ownerPassword: "",
};

export default function Organizations() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusBusy, setStatusBusy] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [actionError, setActionError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [joinResult, setJoinResult] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listPreview, setListPreview] = useState<OrgDetail | null>(null);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const listKey = queryKeys.organizations.list({ search: debouncedSearch || undefined, page, pageSize: 20 });
  const { data, isLoading: loading, isError, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () => getOrganizations({ search: debouncedSearch || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });
  const colleges = Array.isArray(data?.items) ? data.items : [];
  const error = actionError || (isError ? "Could not load organizations." : "");

  const { data: types = [] } = useQuery({
    queryKey: queryKeys.industryCatalog,
    queryFn: () => getIndustryCatalog().catch(() => [] as IndustryCatalog[]),
  });

  const { data: fetchedDetail, isFetching: detailLoading } = useQuery({
    queryKey: queryKeys.organizations.detail(selectedId ?? ""),
    queryFn: () => getOrganization(selectedId!),
    enabled: Boolean(selectedId),
  });

  const detail = selectedId ? ((fetchedDetail as OrgDetail | undefined) ?? listPreview) : null;

  useEffect(() => {
    if (fetchedDetail) setListPreview(fetchedDetail as OrgDetail);
  }, [fetchedDetail]);

  const closeDrawer = () => {
    setSelectedId(null);
    setListPreview(null);
    setResetMessage("");
    setResetError("");
    setOwnerPassword("");
    setShowResetPassword(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    setSubmitting(true);
    try {
      if (form.ownerEmail && form.ownerPassword && form.ownerName) {
        const result = await onboardClient({
          name: form.name,
          code: form.code,
          industry: form.industry || "EDUCATION",
          state: form.state,
          district: form.district,
          principal: form.principal,
          phone: form.phone,
          email: form.email,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
        });
        setJoinResult(result.organization.joinCode);
      } else {
        await createOrganization(form);
        setShowForm(false);
        setForm(EMPTY_FORM);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
    } catch {
      setFormError("Could not create organization.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (c: Organization) => {
    if (statusBusy) return;
    if (c.status === "ACTIVE" && !window.confirm("Suspend this organization's access?")) return;
    setStatusBusy(true);
    setActionError("");
    const next = c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const updated = await updateOrganizationStatus(c.id, next);
      if (listPreview?.id === c.id) setListPreview({ ...listPreview, status: updated.status });
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(c.id) });
    } catch {
      setActionError("Could not update organization status. Please try again.");
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(c.id) });
    } finally { setStatusBusy(false); }
  };

  const openDetail = (c: Organization) => {
    setResetMessage("");
    setResetError("");
    setOwnerPassword("");
    setShowResetPassword(false);
    setSelectedId(c.id);
    setListPreview({ ...c });
  };

  const handleResetOwnerPassword = async () => {
    if (!detail || resetBusy) return;
    setResetError("");
    setResetMessage("");
    if (ownerPassword.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }
    setResetBusy(true);
    try {
      const result = await resetOwnerPassword(detail.id, ownerPassword);
      setOwnerPassword("");
      setResetMessage(`Owner password updated${result.ownerEmail ? ` for ${result.ownerEmail}` : ""}. This is logged.`);
    } catch {
      setResetError("Could not reset owner password.");
    } finally {
      setResetBusy(false);
    }
  };

  const filtered = colleges.filter((c) => filter === "All" || c.status === filter.toUpperCase());

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="section-intro border-0 p-0">
          <p className="page-overline">Platform</p>
          <h1>Every tenant, one workspace.</h1>
          <p>Onboard a client: pick or create a type, then create the organization and owner in one step.</p>
        </div>
        <button
          onClick={() => { setJoinResult(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Onboard client
        </button>
      </div>

      <div className="filter-strip">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            name="organization-search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search organizations..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Suspended"].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <QueryError message={error} retry={refetch} />}

      <div className={`grid gap-5 items-start ${detail ? "xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
      <div className="surface-card min-w-0 overflow-hidden">
        {isError && !data ? null : loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading organizations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No organizations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Organization</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Code</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">State</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Members</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Staff</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/30 ${
                      selectedId === c.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openDetail(c)} className="flex items-center gap-3 text-left">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Building2 size={16} />
                        </div>
                        <span className="font-medium hover:text-teal-700">{c.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs">{c.organizationType?.label ?? c.industry ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{c.code}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{c.state ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{c._count?.members ?? c._count?.students ?? 0}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{c._count?.staff ?? c._count?.admins ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(c)}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          disabled={statusBusy}
                      onClick={() => toggleStatus(c)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                            c.status === "ACTIVE"
                              ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                              : "border-success/30 text-success hover:bg-success/10"
                          }`}
                        >
                          {c.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={20} total={data?.total ?? 0} onPageChange={setPage} />
      {detail && (
        <aside className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5 xl:sticky xl:top-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Organization</p>
              <h2 className="text-lg font-semibold mt-1">{detail.name}</h2>
              <p className="text-sm text-muted-foreground">
                {detail.organizationType?.label ?? detail.industry ?? "Type not set"} · {detail.code}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1 rounded-lg hover:bg-muted"
              aria-label="Close details"
            >
              <X size={18} />
            </button>
          </div>

          {detailLoading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={16} /> Loading details…
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailField label="Status" value={detail.status === "ACTIVE" ? "Active" : "Suspended"} />
            <DetailField label="Join code" value={detail.joinCode ?? "—"} mono />
            <DetailField label="State" value={detail.state ?? "—"} />
            <DetailField label="District" value={detail.district ?? "—"} />
            <DetailField label="Members" value={String(detail._count?.members ?? detail._count?.students ?? 0)} />
            <DetailField label="Staff" value={String(detail._count?.staff ?? detail._count?.admins ?? 0)} />
            <DetailField label="Cases" value={String(detail._count?.incidents ?? 0)} />
            <DetailField label="Departments" value={String(detail._count?.departments ?? detail.departments?.length ?? 0)} />
          </div>

          {detail.staff?.[0] && (
            <div className="rounded-xl border border-border p-4 text-sm space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner</p>
              <p className="font-medium">{detail.staff[0].name}</p>
              <p className="text-muted-foreground">{detail.staff[0].user.email}</p>
            </div>
          )}

          {detail.departments && detail.departments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Departments</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.departments.map((d) => (
                  <span key={d.id} className="px-2 py-0.5 rounded-full bg-muted text-xs">
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-slate-500" />
              <h3 className="font-medium text-sm">Reset owner password</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Sets a temporary password for the owner login. Share it out of band. This action is written to the audit log.
            </p>
            {resetMessage && <div className="px-3 py-2 rounded-lg bg-teal-50 text-teal-800 text-xs">{resetMessage}</div>}
            {resetError && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">{resetError}</div>}
            {showResetPassword ? (
              <>
                <input
                  type="password"
                  name="owner-temp-password"
                  autoComplete="new-password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="New password (min 8)"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
                <button
                  type="button"
                  disabled={resetBusy}
                  onClick={handleResetOwnerPassword}
                  className="w-full py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  {resetBusy ? "Updating…" : "Reset password"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="w-full py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                Set a temporary password
              </button>
            )}
          </div>
        </aside>
      )}
      </div>

      {showForm && (
        <Modal label="Onboard client" onClose={() => { if (!submitting) setShowForm(false); }} busy={submitting} size="sm">
          <form
            onSubmit={handleCreate}
            className="p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Onboard client</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}

            {joinResult && (
              <div className="px-3 py-3 rounded-xl bg-slate-950 text-white text-sm">
                Live. Share join code <span className="font-mono tracking-widest">{joinResult}</span> with members.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Organization type</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Missing a type? Create it under Organization types first.</p>
              </div>
              <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} full />
              <Field label="Code" required value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
              <Field label="State" value={form.state ?? ""} onChange={(v) => setForm({ ...form, state: v })} />
              <Field label="District" value={form.district ?? ""} onChange={(v) => setForm({ ...form, district: v })} />
              <Field label="Primary contact" value={form.principal ?? ""} onChange={(v) => setForm({ ...form, principal: v })} />
              <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} full />
              <Field label="Owner name" required value={form.ownerName} onChange={(v) => setForm({ ...form, ownerName: v })} />
              <Field label="Owner email" required value={form.ownerEmail} onChange={(v) => setForm({ ...form, ownerEmail: v })} />
              <Field label="Owner password" required value={form.ownerPassword} onChange={(v) => setForm({ ...form, ownerPassword: v })} full />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create organization + owner"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium truncate ${mono ? "font-mono tracking-widest" : ""}`}>{value}</p>
    </div>
  );
}

function Field({
  label, value, onChange, required, full,
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-success/15 text-success",
    SUSPENDED: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-muted"}`}>
      {status === "ACTIVE" ? "Active" : "Suspended"}
    </span>
  );
}
