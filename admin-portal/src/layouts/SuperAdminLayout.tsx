import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";
import { useAuth } from "../context/AuthContext";
import { leaveOrganization } from "../services/authService";

export default function SuperAdminLayout() {
  const { user, applySession, logout } = useAuth();
  const navigate = useNavigate();
  const session = user?.supportSession;

  const leave = async () => {
    try {
      const tokens = await leaveOrganization();
      await applySession(tokens, { supportSession: null, organizationName: null, organizationId: null });
    } catch {
      // Banner stays until leave succeeds so the operator is not silently unscoped.
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 h-14 lg:h-12 px-4 lg:px-6 flex items-center justify-end gap-3 border-b border-border bg-white/80 backdrop-blur-md pt-10 lg:pt-0">
          <span className="text-sm text-slate-500 truncate hidden sm:block">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 border border-border"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>
        {session && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2 text-sm flex items-center justify-between gap-3">
            <span>
              Support session: viewing <strong>{session.organizationName}</strong>. Case contents are logged.
            </span>
            <button onClick={leave} className="px-3 py-1 rounded-lg bg-amber-950 text-white text-xs font-medium">
              Leave
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
