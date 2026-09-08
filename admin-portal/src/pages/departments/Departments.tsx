import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Building2 } from "lucide-react";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../services/departmentsService";
import { queryKeys } from "../../lib/queryKeys";

export default function Departments() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actionError, setActionError] = useState("");
  const { data: items = [], isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: getDepartments,
  });
  const error = actionError || (isError ? "Could not load departments." : "");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      setName("");
      setDescription("");
      invalidate();
    },
    onError: () => setActionError("Could not create department."),
  });
  const saving = createMutation.isPending;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setActionError("");
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="page-shell">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Organization</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Departments</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Optional routing tags. A member belongs to one department; staff can cover several.
          Emergencies skip this queue and go to organization security plus any linked guardian.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <form onSubmit={handleCreate} className="surface-card p-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-slate-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hostel Affairs"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What lands in this queue"
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add
        </button>
      </form>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No departments yet. Small teams can skip this — every case stays in one shared queue.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-border">
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Members</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Staff</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Open cases</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {d.name} {d.isDefault && <span className="ml-2 text-[10px] uppercase tracking-wide text-teal-700">Default</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{d.description || "No description"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell tabular-nums">{d._count?.members ?? 0}</td>
                  <td className="px-5 py-4 hidden md:table-cell tabular-nums">{d._count?.staff ?? 0}</td>
                  <td className="px-5 py-4 hidden sm:table-cell tabular-nums">{d._count?.incidents ?? 0}</td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {!d.isDefault && (
                      <button
                        onClick={() => updateDepartment(d.id, { isDefault: true }).then(invalidate)}
                        className="text-xs text-slate-500 hover:text-teal-700"
                      >
                        Make default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${d.name}? Existing cases stay, unassigned.`)) {
                          deleteDepartment(d.id).then(invalidate);
                        }
                      }}
                      className="inline-flex text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
