import { useEffect, useState } from "react";
import { Search, Plus, Building2, Loader2, X } from "lucide-react";
import { getColleges, createCollege, updateCollegeStatus, type CreateCollegeInput } from "../../services/collegesService";
import type { College } from "../../types/student";

const EMPTY_FORM: CreateCollegeInput = { name: "", code: "", state: "", district: "", principal: "", phone: "", email: "" };

export default function Colleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCollegeInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    getColleges({ search: search || undefined, pageSize: 100 })
      .then((res) => setColleges(res.items))
      .catch(() => setError("Could not load colleges."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = setTimeout(load, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await createCollege(form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Could not create college.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (c: College) => {
    const next = c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setColleges((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    try {
      await updateCollegeStatus(c.id, next);
    } catch {
      load(); // revert on failure
    }
  };

  const filtered = colleges.filter((c) => filter === "All" || c.status === filter.toUpperCase());

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Colleges</h1>
          <p className="text-sm text-muted-foreground">Create, edit, activate or suspend colleges</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Add College
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colleges..."
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
            <Loader2 className="animate-spin mr-2" size={18} /> Loading colleges…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No colleges found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">College</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Code</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">State</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Students</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Admins</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Building2 size={16} />
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{c.code}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{c.state ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{c._count?.students ?? 0}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{c._count?.admins ?? 0}</td>
                    <td className="px-4 py-3 text-right">
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
              <h2 className="text-lg font-semibold">Add College</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} full />
              <Field label="Code" required value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
              <Field label="State" value={form.state ?? ""} onChange={(v) => setForm({ ...form, state: v })} />
              <Field label="District" value={form.district ?? ""} onChange={(v) => setForm({ ...form, district: v })} />
              <Field label="Principal" value={form.principal ?? ""} onChange={(v) => setForm({ ...form, principal: v })} />
              <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} full />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create College"}
            </button>
          </form>
        </div>
      )}
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
