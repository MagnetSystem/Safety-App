import { AccountPanel } from "../settings/Settings";
import { useAuth } from "../../context/AuthContext";

export default function SupportSettings() {
  const { user } = useAuth();
  return (
    <div className="page-shell">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Support</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Your account</h1>
        <p className="text-sm text-muted-foreground mt-1">Password for the Magnet Systems support login. Organization types and tenants are managed from the other menu items.</p>
      </div>
      <AccountPanel name={user?.name ?? "Support"} email={user?.email ?? ""} allowName={false} />
    </div>
  );
}
