import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../components/layout/SuperAdminSidebar";

export default function SuperAdminLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
