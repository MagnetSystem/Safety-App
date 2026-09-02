import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { forgotPassword } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch {
      setMessage("If that email has an account, a reset link is on its way.");
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} /> Back to login
      </Link>

      {!sent ? (
        <>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/15 text-primary mb-3">
              <Mail size={20} />
            </div>
            <h1 className="text-xl font-semibold">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@college.edu"
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                         hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-success/15 text-success mb-4">
            <Mail size={22} />
          </div>
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {message} The link is valid for one hour.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 text-sm text-primary hover:underline"
          >
            Back to login
          </Link>
        </div>
      )}
    </div>
  );
}
