import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Menu, Search, X } from "lucide-react";
import Sidebar from "./Sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { useAuth } from "../../context/auth";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";

const titles: Record<string, string> = { reports: "Cases", members: "Members", team: "Admins & staff", departments: "Departments", search: "Search", notifications: "Notifications", settings: "Settings", organizations: "Organizations", "organization-types": "Organization types", "audit-logs": "Audit logs" };

export default function PortalShell({ support = false }: { support?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const unread = useUnreadNotificationCount();
  const base = support ? "/super-admin" : "";
  const parts = location.pathname.replace(base, "").split("/").filter(Boolean);
  const title = titles[parts[0]] ?? "Overview";
  useEffect(() => {
    if (mobileOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [mobileOpen]);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    document.title = `${title} · Safety Platform`;
  }, [location.pathname, title]);
  const navigation = (mobile: boolean) => support
    ? <SuperAdminSidebar onNavigate={mobile ? () => setMobileOpen(false) : undefined} />
    : <Sidebar onNavigate={mobile ? () => setMobileOpen(false) : undefined} />;
  return <div className="portal-shell flex h-dvh overflow-hidden">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="hidden w-[248px] shrink-0 bg-[#173e35] px-4 py-6 lg:block">{navigation(false)}</aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="portal-header flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:px-7 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" aria-label="Open menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="icon-button lg:hidden"><Menu size={21} /></button>
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="hidden max-w-48 truncate text-muted-foreground sm:block">{support ? "Platform" : user?.organizationName || "Workspace"}</span>
            <ChevronRight size={13} className="hidden shrink-0 text-slate-400 sm:block" aria-hidden="true" />
            <span className="truncate font-semibold text-foreground">{title}</span>
            {parts.length > 1 && <span className="hidden text-muted-foreground sm:block">/ Case details</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link to={base + "/search"} aria-label="Search workspace" className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-slate-500 hover:bg-white sm:border sm:border-border sm:bg-white sm:px-3"><Search size={17} /><span className="hidden pr-8 text-xs md:block">Search workspace</span></Link>
          <Link to={base + "/notifications"} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="icon-button relative"><Bell size={19} />{unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />}</Link>
          <Link to={base + "/settings"} aria-label="Your account" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d4dfce] bg-[#e7eedf] text-xs font-semibold text-[#284a38]">{user?.name?.split(" ").filter(Boolean).map(word => word[0]).slice(0,2).join("") || "SP"}</Link>
        </div>
      </header>
      <main ref={contentRef} id="main-content" tabIndex={-1} className="portal-main min-w-0 flex-1 overflow-y-auto"><Outlet /></main>
    </div>
    <dialog ref={dialogRef} onCancel={event => { event.preventDefault(); setMobileOpen(false); }} onClick={event => { if (event.target === event.currentTarget) setMobileOpen(false); }} aria-label="Navigation menu" className="navigation-dialog">
      <div className="flex h-full flex-col bg-[#173e35] p-4">
        <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="mb-2 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg text-white hover:bg-white/10"><X size={20} /></button>
        {mobileOpen && navigation(true)}
      </div>
    </dialog>
  </div>;
}
