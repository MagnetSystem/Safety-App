import { useEffect, useState } from "react";
import {
  LayoutGrid,
  FileWarning,
  Users,
  Search,
  Bell,
  MoreVertical,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../services/notificationsService";

interface NavItem {
  icon: typeof LayoutGrid;
  label: string;
  to: string;
  badge?: number;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications({ unreadOnly: true, pageSize: 1 })
      .then((res) => setUnreadCount(res.total))
      .catch(() => undefined);
  }, []);

  const navItems: NavItem[] = [
    { icon: LayoutGrid, label: "Dashboard", to: "/" },
    { icon: FileWarning, label: "Reports", to: "/reports" },
    { icon: Users, label: "Students", to: "/students" },
    { icon: Search, label: "Search", to: "/search" },
    { icon: Bell, label: "Notifications", to: "/notifications", badge: unreadCount || undefined },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Top bar with collapse icon */}
      <div className={`flex items-center mb-4 ${collapsed && !isMobile ? "justify-center" : "justify-between px-1"}`}>
        {(!collapsed || isMobile) && (
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
            Menu
          </span>
        )}
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-all duration-200"
          >
            <X size={18} strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-all duration-200 border border-transparent hover:border-white/50 hidden lg:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={2} />
            ) : (
              <PanelLeftClose size={18} strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      {/* Profile card */}
      <button
        className={`
          flex items-center gap-2.5 mb-5 rounded-xl
          bg-white/40 hover:bg-white/60
          border border-white/50
          backdrop-blur-md
          transition-all duration-200
          ${collapsed && !isMobile ? "justify-center p-2" : "px-2.5 py-2.5"}
        `}
      >
        <div className="h-9 w-9 rounded-full bg-violet-100/80 text-violet-700 flex items-center justify-center text-[12px] font-bold shrink-0 border border-violet-200/50">
          {user?.name?.split(' ').map(n => n[0]).join('') || 'CA'}
        </div>

        {(!collapsed || isMobile) && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13.5px] font-semibold text-slate-800 truncate">
                {user?.name || 'College Admin'}
              </p>
              <p className="text-[11.5px] text-slate-500 truncate">College Admin</p>
            </div>
            <ChevronsUpDown size={15} className="text-slate-400 shrink-0" />
          </>
        )}
      </button>

      {/* GENERAL */}
      <div className="mb-5">
        {(!collapsed || isMobile) && (
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <p className="text-[10.5px] font-semibold text-slate-400 tracking-wider uppercase">
              GENERAL
            </p>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <MoreVertical size={14} />
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              title={collapsed && !isMobile ? item.label : undefined}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-[13.5px] font-medium transition-all duration-200
                ${collapsed && !isMobile ? "justify-center p-2.5" : "justify-between px-2.5 py-2"}
                ${
                  isActive
                    ? "bg-violet-500/15 text-violet-700 border border-violet-300/40 shadow-sm backdrop-blur-sm"
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-800 border border-transparent"
                }`
              }
            >
              <span className={`flex items-center ${collapsed && !isMobile ? "" : "gap-2.5"}`}>
                <item.icon size={17} strokeWidth={2} />
                {(!collapsed || isMobile) && item.label}
              </span>

              {(!collapsed || isMobile) && item.badge && (
                <span className="bg-rose-500/90 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                  {item.badge}
                </span>
              )}

              {/* Show badge as a small dot when collapsed */}
              {collapsed && !isMobile && item.badge && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="mt-auto pt-4 border-t border-white/30">
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-lg text-[13.5px] font-medium transition-all duration-200 text-slate-600 hover:bg-red-50 hover:text-red-600 w-full
          ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"}`}
        >
          <LogOut size={17} strokeWidth={2} />
          {(!collapsed || isMobile) && "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-white/80 backdrop-blur-md border border-white/50 shadow-md text-slate-700 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-white/90 backdrop-blur-2xl border-r border-white/40
          shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)]
          w-[260px] px-3 py-4
          transition-transform duration-300 ease-in-out
          lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          shrink-0 h-full flex-col transition-all duration-300 ease-in-out
          bg-white/55 backdrop-blur-2xl
          border-r border-white/40
          shadow-[4px_0_24px_-4px_rgba(0,0,0,0.06)]
          ${collapsed ? "w-[72px] px-2" : "w-[240px] px-3"}
          py-4
          hidden lg:flex
        `}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}