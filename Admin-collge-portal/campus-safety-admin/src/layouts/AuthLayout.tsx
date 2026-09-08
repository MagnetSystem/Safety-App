import { Outlet } from "react-router-dom";
import { Shield } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.35),transparent_55%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-teal-200">
            <Shield size={18} />
            Safety Platform
          </div>
          <h1 className="mt-16 text-4xl font-semibold leading-tight tracking-tight max-w-md">
            One workspace for every organization that needs to keep people safe.
          </h1>
          <p className="mt-4 text-slate-300 max-w-md text-sm leading-relaxed">
            Owners, admins and staff work from a shared queue. Members report in seconds. Guardians are only brought in when it is an emergency.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 text-xs text-slate-400">
          <div>
            <p className="text-2xl font-semibold text-white">4</p>
            Case statuses
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">6</p>
            Clear roles
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">1</p>
            Private tenant
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
