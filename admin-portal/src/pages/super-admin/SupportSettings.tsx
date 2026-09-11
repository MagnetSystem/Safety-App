import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AccountPanel } from "../settings/Settings";
import { useAuth } from "../../context/auth";

export default function SupportSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="section-intro border-0 p-0">
          <p className="page-overline">Support</p>
          <h1>Your account</h1>
          <p>Password for the platform support login. Organization types and tenants live in the other menu items.</p>
        </div>
        <button
          type="button"
          onClick={() => { logout(); navigate("/login"); }}
          className="inline-flex items-center gap-2 self-start px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 border border-border"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
      <AccountPanel name={user?.name ?? "Support"} email={user?.email ?? ""} allowName={false} />
    </div>
  );
}
