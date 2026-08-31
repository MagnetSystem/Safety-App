import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FileText, Users, Bell, BarChart2,
  Shield, ChevronRight, Check,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    color: "bg-blue-500/15 text-blue-600",
    title: "Manage Reports",
    desc: "View, review, and act on all anti-ragging complaints filed by your students.",
  },
  {
    icon: Users,
    color: "bg-violet-500/15 text-violet-600",
    title: "Student Directory",
    desc: "Browse enrolled students and view their profiles and complaint history.",
  },
  {
    icon: BarChart2,
    color: "bg-emerald-500/15 text-emerald-600",
    title: "Dashboard Analytics",
    desc: "Track trends, see open vs resolved cases, and monitor monthly activity.",
  },
  {
    icon: Bell,
    color: "bg-amber-500/15 text-amber-600",
    title: "Real-time Notifications",
    desc: "Get notified instantly when new reports come in or evidence is uploaded.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const handleFinish = () => {
    localStorage.removeItem("campus_onboarding");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/70 backdrop-blur-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-border"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/15 text-primary mx-auto">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Your college is now registered on <strong>Campus Safety</strong>.
                Let us take a quick tour of what you can do.
              </p>
            </div>
            <button onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary
                         text-primary-foreground font-semibold hover:opacity-90 transition-all">
              Show me around <ChevronRight size={18} />
            </button>
            <button onClick={handleFinish} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
              Skip - take me to the dashboard
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">What you can do</h2>
              <p className="text-sm text-muted-foreground mt-1">Everything you need to keep your campus safe</p>
            </div>
            <div className="grid gap-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors">
                    <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${f.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all">
                Back
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary
                           text-primary-foreground font-medium text-sm hover:opacity-90 transition-all">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-5">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/15 text-primary mx-auto">
              <Check size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">You are ready to go!</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your dashboard is live. Students can now register and file reports for your college.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-left space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Quick tips</p>
              {[
                "Share the student app link so students can register",
                "Emergency reports are flagged and appear at the top",
                "Use the Search bar to find any student or complaint fast",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check size={12} className="mt-0.5 text-primary flex-shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
            <button onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary
                         text-primary-foreground font-semibold hover:opacity-90 transition-all">
              Go to Dashboard <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
