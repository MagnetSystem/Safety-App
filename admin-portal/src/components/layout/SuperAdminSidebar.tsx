import Sidebar from "./Sidebar";
export default function SuperAdminSidebar({ onNavigate, collapsed, onToggleCollapse }: { onNavigate?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  return <Sidebar support onNavigate={onNavigate} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />;
}
