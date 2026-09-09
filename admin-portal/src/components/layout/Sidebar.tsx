import { useState } from "react";
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
  Building,
  Mail,
  User as UserIcon,
  UserCog,
  Settings,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";
import { canManageOrgTeam } from "../../types/user";

interface NavItem {
  icon: typeof LayoutGrid;
  label: string;
  to: string;
  badge?: number;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = useUnreadNotificationCount();
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const canManagePeople = canManageOrgTeam(user?.role);
  const generalItems: NavItem[] = [
    { icon: LayoutGrid, label: "Dashboard", to: "/" },
    { icon: FileWarning, label: "Cases", to: "/reports" },
  ];
  const organizationItems: NavItem[] = canManagePeople
    ? [
        { icon: UserCog, label: "Admins & Staff", to: "/team" },
        { icon: Users, label: "Members", to: "/members" },
        { icon: Building, label: "Departments", to: "/departments" },
      ]
    : [];
  const utilityItems: NavItem[] = [
    { icon: Search, label: "Search", to: "/search" },
    { icon: Bell, label: "Notifications", to: "/notifications", badge: unreadCount || undefined },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar with collapse icon */}
      <div className={`shrink-0 flex items-center mb-4 ${collapsed && !isMobile ? "justify-center" : "justify-between px-1"}`}>
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
        onClick={() => setShowProfile(true)}
        className={`
          shrink-0 flex items-center gap-2.5 mb-5 rounded-xl
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
                {user?.name || 'Staff'}
              </p>
              <p className="text-[11.5px] text-slate-500 truncate">{user?.organizationName || user?.collegeName || 'Organization'}</p>
            </div>
            <ChevronsUpDown size={15} className="text-slate-400 shrink-0" />
          </>
        )}
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <NavSection
          title="General"
          items={generalItems}
          collapsed={collapsed && !isMobile}
          onItemClick={() => isMobile && setMobileOpen(false)}
        />
        {organizationItems.length > 0 && (
          <NavSection
            title="Organization"
            items={organizationItems}
            collapsed={collapsed && !isMobile}
            onItemClick={() => isMobile && setMobileOpen(false)}
          />
        )}
        <NavSection
          title="Tools"
          items={utilityItems}
          collapsed={collapsed && !isMobile}
          onItemClick={() => isMobile && setMobileOpen(false)}
        />
      </div>

      {/* Logout */}
      <div className="shrink-0 mt-auto pt-4 border-t border-white/30">
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-lg text-[13.5px] font-medium transition-all duration-200 text-slate-600 hover:bg-red-50 hover:text-red-600 w-full
          ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"}`}
        >
          <LogOut size={17} strokeWidth={2} />
          {(!collapsed || isMobile) && "Logout"}
        </button>
      </div>
    </div>
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

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-white/60 shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            >
              <X size={16} />
            </button>
            <div className="p-6 text-center border-b border-slate-100">
              <div className="mx-auto h-20 w-20 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm mb-3">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'CA'}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
              <p className="text-sm font-medium text-violet-600 mt-1">{user?.organizationName || user?.collegeName || 'Organization'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50"><Mail size={16} className="text-slate-500"/></div>
                <div className="text-sm">
                  <p className="text-xs text-slate-400 font-medium">Email Address</p>
                  <p className="font-medium text-slate-700">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50"><Building size={16} className="text-slate-500"/></div>
                <div className="text-sm">
                  <p className="text-xs text-slate-400 font-medium">Organization ID</p>
                  <p className="font-medium text-slate-700 font-mono">{user?.organizationId || user?.collegeId || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50"><UserIcon size={16} className="text-slate-500"/></div>
                <div className="text-sm">
                  <p className="text-xs text-slate-400 font-medium">Role</p>
                  <p className="font-medium text-slate-700 uppercase tracking-wider text-[11px]">{user?.role}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProfile(false)}
                className="px-5 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
            end={item.to === "/"}
            title={collapsed ? item.label : undefined}
            onClick={onItemClick}
            className={({ isActive }) =>
              `relative flex items-center rounded-lg text-[13.5px] font-medium transition-all duration-200
              ${collapsed ? "justify-center p-2.5" : "justify-between px-2.5 py-2"}
              ${
                isActive
                  ? "bg-teal-50 text-teal-800 border border-teal-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
              }`
            }
          >
            <span className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
              <item.icon size={17} strokeWidth={2} />
              {!collapsed && item.label}
            </span>
            {!collapsed && item.badge && (
              <span className="bg-rose-500/90 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
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
