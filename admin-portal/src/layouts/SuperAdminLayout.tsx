import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
