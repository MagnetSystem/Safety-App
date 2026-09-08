import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, User, ChevronRight, ChevronLeft,
  Check, Loader2, Eye, EyeOff, Shield,
} from "lucide-react";
import { registerOrganization } from "../../services/authService";
import { getIndustryCatalog, type IndustryCatalog } from "../../services/departmentsService";
import { useAuth } from "../../context/AuthContext";
import { queryKeys } from "../../lib/queryKeys";

const STEPS = [
  { id: 1, label: "Organization" },
  { id: 2, label: "Owner account" },
  { id: 3, label: "All set" },
];

function StepIndicator({ current }: { current: number }) {
  const icons = [Building2, User, Check];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = icons[i];
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-10 mb-4 transition-colors duration-300 ${
                  done ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          required={required}
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-background border border-border text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                     placeholder:text-muted-foreground transition-all"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SetupField({
  field, value, onChange,
}: {
  field: IndustryCatalog["orgSetupFields"][number];
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm col-span-2 px-3 py-2 rounded-lg border border-border bg-background">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <div className="col-span-2">
        <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm"
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
      <input
        type={field.type === "number" ? "number" : field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
        value={value === undefined || value === false ? "" : String(value)}
        onChange={(e) => onChange(field.type === "number" ? e.target.valueAsNumber || e.target.value : e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm"
      />
      {field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: types = [] } = useQuery({
    queryKey: queryKeys.industryCatalog,
    queryFn: () => getIndustryCatalog().catch(() => [] as IndustryCatalog[]),
  });
  const [industry, setIndustry] = useState("EDUCATION");
  const [org, setOrg] = useState({
    name: "", code: "", state: "", district: "",
    contactName: "", phone: "", email: "", address: "",
  });
  const [setup, setSetup] = useState<Record<string, string | number | boolean>>({});
  const [owner, setOwner] = useState({
    name: "", email: "", password: "", phone: "",
  });

  useEffect(() => {
    if (types[0] && !types.find((t) => t.id === industry)) setIndustry(types[0].id);
  }, [types, industry]);

  const setO = (k: keyof typeof org) => (v: string) => setOrg((p) => ({ ...p, [k]: v }));
  const setOwn = (k: keyof typeof owner) => (v: string) => setOwner((p) => ({ ...p, [k]: v }));

  const selected = types.find((t) => t.id === industry) ?? types[0];
  const step1Valid = org.name.trim().length > 1;
  const step2Valid =
    owner.name.trim().length > 1 &&
    owner.email.includes("@") &&
    owner.password.length >= 8;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await registerOrganization({
        organizationName: org.name,
        organizationCode: org.code.trim() ? org.code.toUpperCase().trim() : undefined,
        industry,
        state: org.state,
        district: org.district,
        contactName: org.contactName,
        phone: org.phone,
        organizationEmail: org.email,
        address: org.address,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerPassword: owner.password,
        ownerPhone: owner.phone,
        setup,
      });
      localStorage.setItem("safety_onboarding", "true");
      await applySession(result, {
        name: owner.name,
        organizationName: org.name,
        organizationId: result.user.organizationId,
      });
      setStep(3);
      setTimeout(() => navigate("/onboarding"), 1600);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not create the organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/15 text-primary mb-3">
          <Building2 size={24} />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Create your organization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a type — campus, workplace, care home, or a custom vertical — and the forms follow
        </p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Organization type</label>
              <select
                value={industry}
                onChange={(e) => { setIndustry(e.target.value); setSetup({}); }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              {selected?.blurb && (
                <p className="text-xs text-muted-foreground mt-2">{selected.blurb}</p>
              )}
              {(selected?.memberFields?.length ?? 0) > 0 && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Members will be asked: {selected!.memberFields.map((f) => f.label).slice(0, 8).join(", ")}
                  {(selected!.memberFields.length > 8) ? "…" : ""}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Field
                label="Organization name"
                required
                value={org.name}
                onChange={setO("name")}
                placeholder="Northwind Mining, Riverside Care, or City College"
              />
            </div>
            <Field
              label="Organization code"
              value={org.code}
              onChange={setO("code")}
              placeholder="NWM-01"
              hint="Short unique code. Leave blank to generate from the name."
            />
            <Field label="State / region" value={org.state} onChange={setO("state")} placeholder="Tamil Nadu" />
            <Field label="City / district" value={org.district} onChange={setO("district")} placeholder="Chennai" />
            <Field label="Primary contact" value={org.contactName} onChange={setO("contactName")} placeholder="Site lead or director" />
            <Field label="Phone" value={org.phone} onChange={setO("phone")} placeholder="+91 98000 00000" type="tel" />
            <div className="col-span-2">
              <Field
                label="Organization email"
                value={org.email}
                onChange={setO("email")}
                placeholder="safety@organization.com"
                type="email"
              />
            </div>
            <div className="col-span-2">
              <Field
                label="Address"
                value={org.address}
                onChange={setO("address")}
                placeholder="Site or head-office address"
              />
            </div>
            {(selected?.orgSetupFields ?? []).map((f) => (
              <SetupField
                key={f.key}
                field={f}
                value={setup[f.key]}
                onChange={(v) => setSetup((p) => ({ ...p, [f.key]: v }))}
              />
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground
                       font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            Next: Owner account <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-primary/80">
            <Shield size={12} className="inline mr-1" />
            This will be the owner login for <strong>{org.name}</strong>
            {selected?.label ? <> ({selected.label})</> : null}
          </div>
          <Field label="Your full name" required value={owner.name} onChange={setOwn("name")} placeholder="Priya Singh" />
          <Field
            label="Work email"
            required
            value={owner.email}
            onChange={setOwn("email")}
            placeholder="you@organization.com"
            type="email"
          />
          <Field
            label="Password"
            required
            value={owner.password}
            onChange={setOwn("password")}
            type="password"
            placeholder="Min. 8 characters"
            hint="You can change this later from Settings"
          />
          <Field
            label="Phone (optional)"
            value={owner.phone}
            onChange={setOwn("phone")}
            placeholder="+91 98000 00000"
            type="tel"
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border
                         text-sm font-medium hover:bg-muted transition-all">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} disabled={!step2Valid || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground
                         font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <>Create organization <Check size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-6 space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/15 text-primary mx-auto">
            <Check size={32} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">You're all set!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>{org.name}</strong> is live.<br />
              Taking you to setup…
            </p>
          </div>
          <Loader2 size={20} className="animate-spin text-primary mx-auto" />
        </div>
      )}

      {step < 3 && (
        <p className="text-center text-xs text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      )}
    </div>
  );
}
