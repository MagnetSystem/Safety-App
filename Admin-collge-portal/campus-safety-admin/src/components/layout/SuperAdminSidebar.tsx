import { useEffect, useState } from "react";
import {
  LayoutGrid, Building2, Users, UserCog, Search, FileWarning,
  ScrollText, Bell, Settings, PanelLeftClose, PanelLeftOpen,
  MoreVertical, ChevronsUpDown, Menu, X, LogOut,
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

const generalItems: NavItem[] = [
  { icon: LayoutGrid, label: "Dashboard", to: "/super-admin" },
  { icon: Building2, label: "Colleges", to: "/super-admin/colleges" },
  { icon: UserCog, label: "College Admins", to: "/super-admin/college-admins" },
  { icon: Users, label: "Students", to: "/super-admin/students" },
  { icon: FileWarning, label: "Reports", to: "/super-admin/reports" },
];

export default function SuperAdminSidebar() {
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

  const systemItems: NavItem[] = [
    { icon: Search, label: "Search", to: "/super-admin/search" },
    { icon: ScrollText, label: "Audit Logs", to: "/super-admin/audit-logs" },
    { icon: Bell, label: "Notifications", to: "/super-admin/notifications", badge: unreadCount || undefined },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Collapse button */}
      <div className={`flex items-center mb-4 ${collapsed && !isMobile ? "justify-center" : "justify-between px-1"}`}>
        {(!collapsed || isMobile) && (
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
            Super Admin
          </span>
        )}
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white/60 transition"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white/60 transition hidden lg:block"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      {/* Profile */}
      <button
        className={`
          flex items-center gap-2.5 mb-5 rounded-xl bg-white/40 hover:bg-white/60
          border border-white/50 backdrop-blur-md transition
          ${collapsed && !isMobile ? "justify-center p-2" : "px-2.5 py-2.5"}
        `}
      >
        <div className="h-9 w-9 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center text-[12px] font-bold border border-amber-200/50">
          SA
        </div>
        {(!collapsed || isMobile) && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13.5px] font-semibold text-slate-800 truncate">
                {user?.name || 'Platform Owner'}
              </p>
              <p className="text-[11.5px] text-slate-500 truncate">Super Admin</p>
            </div>
            <ChevronsUpDown size={15} className="text-slate-400" />
          </>
        )}
      </button>

      {/* GENERAL */}
      <NavSection title="General" items={generalItems} collapsed={collapsed && !isMobile} onItemClick={() => isMobile && setMobileOpen(false)} />

      {/* SYSTEM */}
      <NavSection title="System" items={systemItems} collapsed={collapsed && !isMobile} onItemClick={() => isMobile && setMobileOpen(false)} />

      {/* Bottom */}
      <div className="mt-auto pt-4 border-t border-white/30 space-y-1">
        <NavLink
          to="/super-admin/settings"
          onClick={() => isMobile && setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center rounded-lg text-[13.5px] font-medium transition
            ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"}
            ${isActive ? "bg-violet-500/15 text-violet-700" : "text-slate-600 hover:bg-white/50"}`
          }
        >
          <Settings size={17} />
          {(!collapsed || isMobile) && "Settings"}
        </NavLink>
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-lg text-[13.5px] font-medium transition text-slate-600 hover:bg-red-50 hover:text-red-600 w-full
          ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"}`}
        >
          <LogOut size={17} />
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
          shrink-0 h-full flex-col transition-all duration-300
          bg-white/55 backdrop-blur-2xl border-r border-white/40
          shadow-[4px_0_24px_-4px_rgba(0,0,0,0.06)]
          ${collapsed ? "w-[72px] px-2" : "w-[240px] px-3"} py-4
          hidden lg:flex
        `}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}

function NavSection({
  title,
  items,
  collapsed,
  onItemClick,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  return (
    <div className="mb-5">
      {!collapsed && (
        <div className="flex items-center justify-between px-2.5 mb-1.5">
          <p className="text-[10.5px] font-semibold text-slate-400 tracking-wider uppercase">
            {title}
          </p>
          <MoreVertical size={14} className="text-slate-400" />
        </div>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/super-admin"}
            title={collapsed ? item.label : undefined}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-[13.5px] font-medium transition relative
              ${collapsed ? "justify-center p-2.5" : "justify-between px-2.5 py-2"}
              ${
                isActive
                  ? "bg-violet-500/15 text-violet-700 border border-violet-300/40"
                  : "text-slate-600 hover:bg-white/50 border border-transparent"
              }`
            }
          >
            <span className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
              <item.icon size={17} />
              {!collapsed && item.label}
            </span>
            {!collapsed && item.badge && (
              <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {item.badge}
              </span>
            )}
            {collapsed && item.badge && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
