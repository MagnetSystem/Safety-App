import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, User, ChevronRight, ChevronLeft,
  Check, Loader2, Eye, EyeOff, Shield,
} from "lucide-react";
import { registerCollege, type RegisterCollegeInput } from "../../services/authService";

const STEPS = [
  { id: 1, label: "College Details", icon: "Building2" },
  { id: 2, label: "Admin Account",   icon: "User" },
  { id: 3, label: "All Set!",        icon: "Check" },
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

export default function RegisterCollege() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [college, setCollege] = useState({
    collegeName: "", collegeCode: "", state: "", district: "",
    principal: "", phone: "", collegeEmail: "", address: "",
  });
  const [admin, setAdmin] = useState({
    adminName: "", adminEmail: "", adminPassword: "", adminPhone: "",
  });

  const setC = (k: keyof typeof college) => (v: string) => setCollege((p) => ({ ...p, [k]: v }));
  const setA = (k: keyof typeof admin) => (v: string) => setAdmin((p) => ({ ...p, [k]: v }));

  const step1Valid = college.collegeName.trim().length > 1 && college.collegeCode.trim().length > 1;
  const step2Valid =
    admin.adminName.trim().length > 1 &&
    admin.adminEmail.includes("@") &&
    admin.adminPassword.length >= 8;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload: RegisterCollegeInput = {
        ...college,
        ...admin,
        collegeCode: college.collegeCode.toUpperCase().trim(),
      };
      const result = await registerCollege(payload);
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("campus_onboarding", "true");
      setStep(3);
      setTimeout(() => navigate("/"), 2200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Registration failed. Please try again.");
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
        <h1 className="text-xl font-semibold text-foreground">Register Your College</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your institution on Campus Safety in under 2 minutes
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
              <Field label="College Name" required value={college.collegeName} onChange={setC("collegeName")}
                placeholder="Government Engineering College" />
            </div>
            <Field label="College Code" required value={college.collegeCode} onChange={setC("collegeCode")}
              placeholder="GEC-TN" hint="Short unique code e.g. GEC-TN" />
            <Field label="State" value={college.state} onChange={setC("state")} placeholder="Tamil Nadu" />
            <Field label="District" value={college.district} onChange={setC("district")} placeholder="Chennai" />
            <Field label="Principal" value={college.principal} onChange={setC("principal")} placeholder="Dr. A. Kumar" />
            <Field label="Phone" value={college.phone} onChange={setC("phone")} placeholder="+91 98000 00000" type="tel" />
            <div className="col-span-2">
              <Field label="Official Email" value={college.collegeEmail} onChange={setC("collegeEmail")}
                placeholder="office@college.edu" type="email" />
            </div>
            <div className="col-span-2">
              <Field label="Address" value={college.address} onChange={setC("address")}
                placeholder="123 College Road, Chennai" />
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground
                       font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            Next: Admin Account <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-primary/80">
            <Shield size={12} className="inline mr-1" />
            This will be your admin account for <strong>{college.collegeName}</strong>
          </div>
          <Field label="Your Full Name" required value={admin.adminName} onChange={setA("adminName")} placeholder="Priya Singh" />
          <Field label="Admin Email" required value={admin.adminEmail} onChange={setA("adminEmail")}
            placeholder="admin@college.edu" type="email" />
          <Field label="Password" required value={admin.adminPassword} onChange={setA("adminPassword")}
            type="password" placeholder="Min. 8 characters"
            hint="You can change this later from your profile settings" />
          <Field label="Phone (optional)" value={admin.adminPhone} onChange={setA("adminPhone")}
            placeholder="+91 98000 00000" type="tel" />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border
                         text-sm font-medium hover:bg-muted transition-all">
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} disabled={!step2Valid || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground
                         font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <>Create College <Check size={16} /></>}
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
              <strong>{college.collegeName}</strong> has been registered.<br />
              Taking you to your dashboard…
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
