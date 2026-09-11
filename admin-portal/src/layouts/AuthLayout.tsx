import { Outlet } from "react-router-dom";
import { Shield } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[#f7f8f4]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#173e35] p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,233,202,0.16),transparent_55%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-[#dce9ca]">
            <Shield size={18} />
            Safety Platform
          </div>
          <h1 className="mt-16 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            A clear path from concern to care.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/70">
            Review concerns, coordinate your team and follow every case through to resolution. A focused workspace for the people responsible for safety.
          </p>
        </div>
        <div className="relative border-t border-white/10 pt-6 text-sm text-emerald-100/70">Listen carefully. Act confidently. Follow through.</div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
