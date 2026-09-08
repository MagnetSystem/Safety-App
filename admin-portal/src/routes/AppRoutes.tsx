import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import { useAuth } from '../context/AuthContext';
import { isOrgDashboardRole } from '../types/user';

const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ReportsList = lazy(() => import('../pages/reports/ReportsList'));
const ReportDetail = lazy(() => import('../pages/reports/ReportDetail'));
const Members = lazy(() => import('../pages/members/Members'));
const Search = lazy(() => import('../pages/search/Search'));
const Notifications = lazy(() => import('../pages/notifications/Notifications'));
const Login = lazy(() => import('../pages/auth/Login'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const SuperAdminDashboard = lazy(() => import('../pages/super-admin/Dashboard'));
const Organizations = lazy(() => import('../pages/super-admin/Organizations'));
const Staff = lazy(() => import('../pages/super-admin/Staff'));
const AuditLogs = lazy(() => import('../pages/super-admin/AuditLogs'));
const RegisterOrganization = lazy(() => import('../pages/auth/RegisterOrganization'));
const Onboarding = lazy(() => import('../pages/onboarding/Onboarding'));
const Departments = lazy(() => import('../pages/departments/Departments'));
const OrganizationTypes = lazy(() => import('../pages/super-admin/OrganizationTypes'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const SupportSettings = lazy(() => import('../pages/super-admin/SupportSettings'));

function ProtectedRoute({ children, portal }: { children: React.ReactNode; portal: 'org' | 'support' }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (portal === 'support' && role !== 'support') {
    if (isOrgDashboardRole(role)) return <Navigate to="/" replace />;
    return <Navigate to="/login" replace />;
  }

  if (portal === 'org' && !isOrgDashboardRole(role)) {
    if (role === 'support') return <Navigate to="/super-admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    if (role === 'support') return <Navigate to="/super-admin" replace />;
    if (isOrgDashboardRole(role)) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const RouteFallback = () => (
  <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
    Loading…
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterOrganization />} />
      </Route>
      
      <Route
        path="/"
        element={
          <ProtectedRoute portal="org">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="members" element={<Members />} />
        <Route path="students" element={<Navigate to="/members" replace />} />
        <Route path="departments" element={<Departments />} />
        <Route path="search" element={<Search />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/super-admin"
        element={
          <ProtectedRoute portal="support">
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="colleges" element={<Navigate to="/super-admin/organizations" replace />} />
        <Route path="organization-types" element={<OrganizationTypes />} />
        <Route path="staff" element={<Staff />} />
        <Route path="college-admins" element={<Navigate to="/super-admin/staff" replace />} />
        <Route path="members" element={<Members />} />
        <Route path="students" element={<Navigate to="/super-admin/members" replace />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<SupportSettings />} />
      </Route>

      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
