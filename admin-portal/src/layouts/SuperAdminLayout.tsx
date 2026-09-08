import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";
import { useAuth } from "../context/AuthContext";
import { leaveOrganization } from "../services/authService";

export default function SuperAdminLayout() {
  const { user, applySession } = useAuth();
  const session = user?.supportSession;

  const leave = async () => {
    try {
      const tokens = await leaveOrganization();
      await applySession(tokens, { supportSession: null, organizationName: null, organizationId: null });
    } catch {
      // Banner stays until leave succeeds so the operator is not silently unscoped.
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
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
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
