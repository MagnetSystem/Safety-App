import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import {
  createOrganizationType,
  duplicateOrganizationType,
  listOrganizationTypes,
  setOrganizationTypeActive,
  type OrganizationTypeRecord,
  type UpsertOrganizationType,
} from "../../services/organizationTypesService";

const EMPTY_FEATURES = {
  guardianAlerts: false,
  bulkSignup: false,
  reporting: true,
  departmentsEnabled: true,
};

const emptyDraft = (): UpsertOrganizationType => ({
  label: "",
  blurb: "",
  features: { ...EMPTY_FEATURES },
  categories: [{ key: "OTHER", label: "Other" }],
  defaultDepartments: [],
  orgSetupFields: [],
  memberFields: [
    { key: "name", label: "Full name", type: "text", group: "identity", required: true },
    { key: "mobile", label: "Mobile number", type: "tel", group: "identity", required: true },
  ],
});

function slugKey(label: string) {
  return label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);
}

export default function OrganizationTypes() {
  const [rows, setRows] = useState<OrganizationTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UpsertOrganizationType>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [catLabel, setCatLabel] = useState("");
  const [deptName, setDeptName] = useState("");

  const load = () => {
    setLoading(true);
    listOrganizationTypes()
      .then(setRows)
      .catch(() => setError("Could not load organization types."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const canCreate = draft.label.trim().length > 1 && draft.memberFields.length > 0;

  const addField = () => {
    if (fieldLabel.trim().length < 2) return;
    const key = slugKey(fieldLabel).toLowerCase();
    setDraft((d) => ({
      ...d,
      memberFields: [...d.memberFields, { key, label: fieldLabel.trim(), type: fieldType, group: "role", required: fieldRequired }],
    }));
    setFieldLabel("");
    setFieldRequired(false);
  };

  const addCategory = () => {
    if (catLabel.trim().length < 2) return;
    setDraft((d) => ({
      ...d,
      categories: [...d.categories, { key: slugKey(catLabel), label: catLabel.trim() }],
    }));
    setCatLabel("");
  };

  const addDept = () => {
    if (deptName.trim().length < 2) return;
    setDraft((d) => ({
      ...d,
      defaultDepartments: [
        ...d.defaultDepartments,
        { name: deptName.trim(), slug: slugKey(deptName).toLowerCase().replace(/_/g, "-"), description: "" },
      ],
    }));
    setDeptName("");
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await createOrganizationType(draft);
      setWizard(false);
      setDraft(emptyDraft());
      setStep(0);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not save this type.");
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => draft.memberFields, [draft.memberFields]);

  return (
    <div className="page-shell">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Support</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Organization types</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            When a client is not Education, Corporate or Care, sit with them, capture the fields they actually need, and publish a type.
            It appears on signup immediately so they can onboard without a rebuild.
          </p>
        </div>
        <button
          onClick={() => { setDraft(emptyDraft()); setStep(0); setWizard(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium"
        >
          <Plus size={16} /> New type
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-teal-700" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-border">
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Slug</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Orgs</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.dbId} className="border-b border-border last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{row.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{row.blurb || "No description"}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell font-mono text-xs">{row.id}</td>
                  <td className="px-5 py-4 hidden sm:table-cell tabular-nums">{row.orgCount}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium ${row.isActive ? "text-teal-700" : "text-slate-400"}`}>
                      {row.isSystem ? "Built-in" : row.isActive ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-3">
                    <button
                      onClick={async () => {
                        const label = window.prompt("Name for the copy", `${row.label} (copy)`);
                        if (!label) return;
                        await duplicateOrganizationType(row.dbId, label);
                        load();
                      }}
                      className="text-xs text-slate-500 hover:text-teal-700 inline-flex items-center gap-1"
                    >
                      <Copy size={12} /> Duplicate
                    </button>
                    {!row.isSystem && (
                      <button
                        onClick={async () => {
                          await setOrganizationTypeActive(row.dbId, !row.isActive);
                          load();
                        }}
                        className="text-xs text-slate-500 hover:text-teal-700 inline-flex items-center gap-1"
                      >
                        {row.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {row.isActive ? "Hide" : "Show"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {wizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-teal-700 font-semibold">Create type</p>
                <h2 className="text-lg font-semibold">Ask the client, then save once</h2>
              </div>
              <button onClick={() => setWizard(false)} className="text-slate-400 text-sm">Close</button>
            </div>
            <div className="flex gap-2 mb-5">
              {["Basics", "Fields", "Queues"].map((label, i) => (
                <button key={label} onClick={() => setStep(i)} className={`text-xs px-3 py-1 rounded-full ${step === i ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {i + 1}. {label}
                </button>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <label className="block text-sm">
                  What do they call this organization?
                  <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2" placeholder="Factory, Sports academy, NGO…" />
                </label>
                <label className="block text-sm">
                  One-line description
                  <textarea value={draft.blurb} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2" rows={2} />
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([
                    ["reporting", "Members can file reports"],
                    ["departmentsEnabled", "Use department queues"],
                    ["guardianAlerts", "Guardian SOS alerts"],
                    ["bulkSignup", "Bulk member import"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 border rounded-xl px-3 py-2">
                      <input
                        type="checkbox"
                        checked={draft.features[key]}
                        onChange={(e) => setDraft({ ...draft, features: { ...draft.features, [key]: e.target.checked } })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Required fields members will fill after they join. Keep this short — identity, role, emergency contact.</p>
                <div className="space-y-2">
                  {preview.map((f) => (
                    <div key={f.key} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 text-sm">
                      <span>{f.label}{f.required ? " *" : ""}</span>
                      <span className="text-xs text-slate-400">{f.type}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1fr_120px_auto] gap-2">
                  <input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} placeholder="Field label" className="border rounded-xl px-3 py-2 text-sm" />
                  <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="border rounded-xl px-2 text-sm">
                    <option value="text">Text</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                  <button type="button" onClick={addField} className="px-3 rounded-xl bg-slate-900 text-white text-sm">Add</button>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={fieldRequired} onChange={(e) => setFieldRequired(e.target.checked)} />
                  Required
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Incident categories</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {draft.categories.map((c) => (
                      <span key={c.key} className="text-xs bg-slate-100 rounded-full px-3 py-1">{c.label}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input value={catLabel} onChange={(e) => setCatLabel(e.target.value)} placeholder="e.g. Equipment failure" className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                    <button type="button" onClick={addCategory} className="px-3 rounded-xl border text-sm">Add</button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Default departments</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {draft.defaultDepartments.map((d) => (
                      <span key={d.slug} className="text-xs bg-teal-50 text-teal-800 rounded-full px-3 py-1">{d.name}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Floor safety" className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                    <button type="button" onClick={addDept} className="px-3 rounded-xl border text-sm">Add</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(Math.max(0, step - 1))} className="text-sm text-slate-500" disabled={step === 0}>Back</button>
              {step < 2 ? (
                <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Next</button>
              ) : (
                <button onClick={submit} disabled={!canCreate || saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm disabled:opacity-50">
                  {saving ? "Saving…" : "Publish type"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
