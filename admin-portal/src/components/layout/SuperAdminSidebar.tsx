import Sidebar from "./Sidebar";
export default function SuperAdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <Sidebar support onNavigate={onNavigate} />;
}
