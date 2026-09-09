import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Crown, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<"org" | "support">("org");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const showDemo = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const actualRole = await login(form.email, form.password, remember);

      if (actualRole === "support") {
        navigate("/super-admin");
      } else if (actualRole === "owner" || actualRole === "admin" || actualRole === "staff") {
        if (localStorage.getItem("safety_onboarding") === "true") {
          navigate("/onboarding");
        } else {
          navigate("/");
        }
      } else {
        setError("This account is not authorized to access the admin portal.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
      {/* Role Toggle */}
      <div className="flex p-1 bg-muted rounded-lg mb-8">
        <button
          type="button"
          onClick={() => { setRole("org"); setError(""); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
            role === "org"
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield size={16} />
          Organization
        </button>
        <button
          type="button"
          onClick={() => { setRole("support"); setError(""); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
            role === "support"
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Crown size={16} />
          Support
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4 transition-colors duration-300 ${
            role === "org"
              ? "bg-primary/15 text-primary"
              : "bg-amber-500/15 text-amber-600"
          }`}
        >
          {role === "org" ? <Shield size={24} /> : <Crown size={24} />}
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          {role === "org" ? "Organization login" : "Support login"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "org"
            ? "Sign in as Owner, Admin, or Staff"
            : "Sign in to manage the platform"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={role === "org" ? "you@organization.com" : "support@platform.com"}
            className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                       placeholder:text-muted-foreground transition-all duration-200"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-background border border-border text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                         placeholder:text-muted-foreground transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">
            Remember me on this device
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-lg font-medium text-sm
                     transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 ${
                       role === "org"
                         ? "bg-primary text-primary-foreground hover:opacity-90"
                         : "bg-amber-600 text-white hover:bg-amber-700"
                     }`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {showDemo && (
        <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            Demo login:{" "}
            {role === "org" ? "admin@gec-demo.edu" : "superadmin@campussafety.dev"} / ChangeMe123!
          </p>
        </div>
      )}

      {role === "org" && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          New organization?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Register your organization
          </Link>
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground mt-2">
        Safety Platform — for authorized staff only
      </p>
    </div>
  );
}
