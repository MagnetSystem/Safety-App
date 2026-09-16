import { NavLink, useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, Building2, FileWarning, LayoutGrid, Layers, LogOut, PanelLeftClose, PanelLeftOpen, ScrollText, Search, Settings, ShieldCheck, UserCog, Users } from "lucide-react";
import { useAuth } from "../../context/auth";
import { canManageOrgTeam } from "../../types/user";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";

export default function Sidebar({ support = false, onNavigate, collapsed = false, onToggleCollapse }: { support?: boolean; onNavigate?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadNotificationCount();
  const base = support ? "/super-admin" : "";
  const groups = [
    { label: "Workspace", items: [
      { to: base || "/", label: "Overview", icon: LayoutGrid },
      { to: base + "/reports", label: "Cases", icon: FileWarning },
      { to: base + "/notifications", label: "Notifications", icon: Bell },
    ] },
    { label: support ? "Platform" : "Organization", items: support ? [
      { to: base + "/organizations", label: "Organizations", icon: Building2 },
      { to: base + "/organization-types", label: "Organization types", icon: Layers },
      { to: base + "/audit-logs", label: "Audit logs", icon: ScrollText },
    ] : canManageOrgTeam(role) ? [
      { to: "/members", label: "Members", icon: Users },
      { to: "/team", label: "Admins & staff", icon: UserCog },
      { to: "/departments", label: "Departments", icon: Building2 },
    ] : [] },
    { label: "Tools", items: [
      { to: base + "/search", label: "Search", icon: Search },
      { to: base + "/settings", label: "Settings", icon: Settings },
    ] },
  ];
  return <div className="portal-navigation flex h-full min-h-0 flex-col">
    <div className={"flex items-center pb-8 pt-2 " + (collapsed ? "flex-col gap-3 px-0" : "justify-between gap-2 px-3")}>
      <NavLink to={base || "/"} onClick={onNavigate} className="flex min-w-0 items-center gap-3 text-white" aria-label="Safety Platform home">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10"><ShieldCheck size={23} strokeWidth={1.6} /></span>
        {!collapsed && <span className="min-w-0"><span className="block truncate text-[17px] font-semibold tracking-tight">Safety Platform</span><span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-100/60">{support ? "Platform support" : "Care in action"}</span></span>}
      </NavLink>
      {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-100/60 hover:bg-white/10 hover:text-white">
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>}
    </div>
    {!collapsed && <div className="mx-2 mb-7 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100/60">{support ? "Your workspace" : "Organization"}</p>
      <p className="mt-1 truncate text-[13px] font-medium text-white">{support ? "Platform administration" : user?.organizationName || "Your organization"}</p>
    </div>}
    <div className="min-h-0 flex-1 overflow-y-auto">
      {groups.filter(group => group.items.length).map(group => <nav aria-label={group.label} key={group.label} className="mb-7">
        {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/50">{group.label}</p>}
        <div className="space-y-1">{group.items.map(item => <NavLink key={item.to} to={item.to} end={item.to === "/" || item.to === "/super-admin"} onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => "nav-item " + (isActive ? "nav-item-active" : "") + (collapsed ? " justify-center px-0" : "")}>
          <span className="relative flex shrink-0 items-center justify-center">
            <item.icon size={18} strokeWidth={1.7} aria-hidden="true" />
            {collapsed && item.label === "Notifications" && unread > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white" aria-hidden="true" />}
          </span>
          {!collapsed && <span className="min-w-0 flex-1">{item.label}</span>}
          {!collapsed && item.label === "Notifications" && unread > 0 && <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] tabular-nums" aria-label={`${unread} unread notifications`}>{unread > 99 ? "99+" : unread}</span>}
        </NavLink>)}</div>
      </nav>)}
    </div>
    <div className="mt-4 border-t border-white/10 pt-4">
      <NavLink to={base + "/settings"} onClick={onNavigate} title={collapsed ? user?.name || "Your account" : undefined} className={"flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5" + (collapsed ? " justify-center px-0" : "")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c5d9ba] text-xs font-semibold text-[#173e35]">{user?.name?.split(" ").filter(Boolean).map(word => word[0]).slice(0,2).join("") || "SP"}</span>
        {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">{user?.name || "Your account"}</span><span className="block text-[11px] capitalize text-emerald-100/60">{role}</span></span>}
        {!collapsed && <ArrowUpRight size={15} className="text-emerald-100/50" aria-hidden="true" />}
      </NavLink>
      <button type="button" onClick={() => { logout(); onNavigate?.(); navigate("/login", { replace: true }); }} title={collapsed ? "Sign out" : undefined} className={"mt-2 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-xs text-emerald-100/65 hover:bg-white/5 hover:text-white" + (collapsed ? " justify-center px-0" : "")}><LogOut size={16} /> {!collapsed && "Sign out"}</button>
    </div>
  </div>;
}
