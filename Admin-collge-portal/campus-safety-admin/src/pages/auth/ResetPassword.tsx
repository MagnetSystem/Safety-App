import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);

    // TODO: call reset password API with token from URL
    setTimeout(() => {
      setLoading(false);
      navigate("/login");
    }, 1000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/15 text-primary mb-3">
          <Lock size={20} />
        </div>
        <h1 className="text-xl font-semibold">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-background border border-border text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-background border border-border text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                     hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? "Updating..." : "Reset password"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
