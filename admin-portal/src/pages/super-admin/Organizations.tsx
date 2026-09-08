import { useEffect, useState } from "react";
import { Search, Plus, Building2, Loader2, X, LogIn, KeyRound } from "lucide-react";
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
import { enterOrganization } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import type { Organization } from "../../types/organization";

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
  const { user, applySession } = useAuth();
  const [colleges, setColleges] = useState<Organization[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [types, setTypes] = useState<IndustryCatalog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [joinResult, setJoinResult] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const load = () => {
    setLoading(true);
    getOrganizations({ search: search || undefined, pageSize: 100 })
      .then((res) => setColleges(res.items))
      .catch(() => setError("Could not load organizations."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = setTimeout(load, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    getIndustryCatalog().then(setTypes).catch(() => undefined);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Could not create organization.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (c: Organization) => {
    const next = c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setColleges((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    setDetail((prev) => (prev?.id === c.id ? { ...prev, status: next } : prev));
    try {
      await updateOrganizationStatus(c.id, next);
    } catch {
      load(); // revert on failure
    }
  };

  const openDetail = async (c: Organization) => {
    setResetMessage("");
    setResetError("");
    setOwnerPassword("");
    setDetail(c);
    setDetailLoading(true);
    try {
      const org = await getOrganization(c.id);
      setDetail(org);
    } catch {
      setError("Could not load organization details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const enterOrg = async (org: { id: string; name: string }) => {
    setEntering(true);
    setError("");
    try {
      const tokens = await enterOrganization(org.id);
      await applySession(tokens, {
        organizationId: org.id,
        organizationName: org.name,
        supportSession: { organizationId: org.id, organizationName: org.name },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not enter this organization.");
    } finally {
      setEntering(false);
    }
  };

  const handleResetOwnerPassword = async () => {
    if (!detail) return;
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
    } catch (err: any) {
      setResetError(err?.response?.data?.message || "Could not reset owner password.");
    } finally {
      setResetBusy(false);
    }
  };

  const filtered = colleges.filter((c) => filter === "All" || c.status === filter.toUpperCase());

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">Onboard a client: pick (or create) a type, then create the org and owner in one step</p>
        </div>
        <button
          onClick={() => { setJoinResult(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          <Plus size={16} /> Onboard client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Suspended"].map((s) => (
            <button
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

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        {loading ? (
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
                      user?.supportSession?.organizationId === c.id ? "bg-amber-50/80" : ""
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
                          onClick={() => enterOrg(c)}
                          disabled={entering}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50"
                        >
                          Enter
                        </button>
                        <button
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4"
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
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
          <button type="button" aria-label="Close details" className="flex-1" onClick={() => setDetail(null)} />
          <aside className="w-full max-w-md h-full bg-card border-l border-border shadow-xl overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Organization</p>
                <h2 className="text-lg font-semibold mt-1">{detail.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {detail.organizationType?.label ?? detail.industry ?? "Type not set"} · {detail.code}
                </p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-muted">
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

            <button
              type="button"
              disabled={entering}
              onClick={() => enterOrg(detail)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 text-amber-950 font-medium text-sm hover:bg-amber-400 disabled:opacity-60"
            >
              {entering ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Enter organization
            </button>
            <p className="text-[11px] text-muted-foreground">
              Opens a support session. Case views are audited. Use Leave in the banner when finished.
            </p>

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
              <input
                type="password"
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
            </div>
          </aside>
        </div>
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
