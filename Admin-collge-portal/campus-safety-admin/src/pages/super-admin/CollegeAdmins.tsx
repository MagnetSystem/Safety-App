import { useEffect, useState } from "react";
import { Search, Plus, Loader2, X } from "lucide-react";
import {
  getCollegeAdmins, createCollegeAdmin, activateCollegeAdmin, deactivateCollegeAdmin, resetCollegeAdminPassword,
  type CreateCollegeAdminInput,
} from "../../services/collegeAdminsService";
import { getColleges } from "../../services/collegesService";
import type { CollegeAdmin, College } from "../../types/student";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", collegeId: "" };

export default function CollegeAdmins() {
  const [admins, setAdmins] = useState<CollegeAdmin[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    getCollegeAdmins({ pageSize: 100 })
      .then((res) => setAdmins(res.items))
      .catch(() => setError("Could not load college admins."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    getColleges({ pageSize: 200 }).then((res) => setColleges(res.items)).catch(() => undefined);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.collegeId) {
      setFormError("Please select a college.");
      return;
    }
    setSubmitting(true);
    try {
      await createCollegeAdmin(form as CreateCollegeAdminInput);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Could not create college admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (a: CollegeAdmin) => {
    const wasActive = a.user.isActive;
    setAdmins((prev) => prev.map((x) => (x.id === a.id ? { ...x, user: { ...x.user, isActive: !wasActive } } : x)));
    try {
      if (wasActive) await deactivateCollegeAdmin(a.id);
      else await activateCollegeAdmin(a.id);
    } catch {
      load();
    }
  };

  const handleResetPassword = async (a: CollegeAdmin) => {
    const newPassword = window.prompt(`New password for ${a.user.email} (min 8 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 8) {
      window.alert("Password must be at least 8 characters.");
      return;
    }
    try {
      await resetCollegeAdminPassword(a.id, newPassword);
      window.alert("Password reset successfully.");
    } catch {
      window.alert("Could not reset password.");
    }
  };

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.user.email.toLowerCase().includes(q) ||
      a.college?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">College Admins</h1>
          <p className="text-sm text-muted-foreground">Manage college admin accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, college..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading admins…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No college admins found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left font-medium px-4 py-3">College</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{a.user.email}</td>
                    <td className="px-4 py-3">{a.college?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.user.isActive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}>
                        {a.user.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleResetPassword(a)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => toggleStatus(a)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                          a.user.isActive
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                            : "border-success/30 text-success hover:bg-success/10"
                        }`}
                      >
                        {a.user.isActive ? "Suspend" : "Activate"}
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
              <h2 className="text-lg font-semibold">Add College Admin</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">College</label>
                <select
                  required
                  value={form.collegeId}
                  onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select college…</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Temp Password</label>
                  <input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Admin"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
