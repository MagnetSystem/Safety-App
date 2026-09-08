import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Copy, Loader2, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getIndustryCatalog, type IndustryCatalog } from "../../services/departmentsService";
import api from "../../services/api";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState<IndustryCatalog[]>([]);
  const [joinCode, setJoinCode] = useState<string>("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getIndustryCatalog().catch(() => [] as IndustryCatalog[]),
      api.get("/organizations/me").then((r) => r.data).catch(() => null),
    ]).then(([industries, org]) => {
      setCatalog(industries);
      setJoinCode(org?.joinCode ?? "");
      setOrgIndustry(org?.industry ?? org?.organizationType?.slug ?? "");
    }).finally(() => setLoading(false));
  }, []);

  const handleFinish = () => {
    localStorage.removeItem("campus_onboarding");
    navigate("/");
  };

  const industry = catalog.find((c) => c.id === orgIndustry) ?? catalog[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl surface-card p-8 animate-fade-in">
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-10 bg-teal-600" : i < step ? "w-6 bg-teal-300" : "w-6 bg-slate-200"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Your organization is live. We collect only the fields that matter for safety work — identity, role, location, and emergency contacts — and keep medical data for SOS only.
              </p>
            </div>
            <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-teal-600 text-white font-medium flex items-center justify-center gap-2">
              Continue setup <ChevronRight size={16} />
            </button>
            <button onClick={handleFinish} className="w-full text-xs text-slate-400">Skip to dashboard</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">What members will fill in</h2>
            <p className="text-sm text-slate-500">
              These forms change with the industry you picked. You can edit them later in settings.
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(industry?.memberFields ?? []).slice(0, 12).map((f) => (
                <div key={f.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 text-sm">
                  <span className="font-medium text-slate-800">{f.label}</span>
                  <span className="text-xs text-slate-400 uppercase">{f.group}{f.required ? " · required" : ""}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl border text-sm">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
              <Check size={22} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Share the join code</h2>
              <p className="text-sm text-slate-500 mt-2">Members enter this in the app. Guardians are invited separately, and only see emergencies.</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950 text-white font-mono text-lg tracking-[0.3em]">
              {joinCode || "--------"}
              <button
                onClick={() => joinCode && navigator.clipboard.writeText(joinCode)}
                className="text-teal-300"
              >
                <Copy size={16} />
              </button>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex gap-2"><Check size={14} className="mt-0.5 text-teal-600" /> Add departments if your team is large enough to split the queue</li>
              <li className="flex gap-2"><Check size={14} className="mt-0.5 text-teal-600" /> Invite admins, then staff — you can handle cases yourself until then</li>
              <li className="flex gap-2"><Check size={14} className="mt-0.5 text-teal-600" /> Emergencies alert org security and the linked guardian at the same time</li>
            </ul>
            <button onClick={handleFinish} className="w-full py-3 rounded-xl bg-teal-600 text-white font-medium">
              Go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
