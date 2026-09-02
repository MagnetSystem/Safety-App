import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import { useAuth } from '../context/AuthContext';

// Route-level code splitting — keeps heavy pages (e.g. ReportDetail with its
// PDF libs) out of the initial bundle.
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const ReportsList = lazy(() => import('../pages/reports/ReportsList'));
const ReportDetail = lazy(() => import('../pages/reports/ReportDetail'));
const Students = lazy(() => import('../pages/students/Students'));
const Search = lazy(() => import('../pages/search/Search'));
const Notifications = lazy(() => import('../pages/notifications/Notifications'));
const Login = lazy(() => import('../pages/auth/Login'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const SuperAdminDashboard = lazy(() => import('../pages/super-admin/Dashboard'));
const Colleges = lazy(() => import('../pages/super-admin/Colleges'));
const CollegeAdmins = lazy(() => import('../pages/super-admin/CollegeAdmins'));
const AuditLogs = lazy(() => import('../pages/super-admin/AuditLogs'));
const RegisterCollege = lazy(() => import('../pages/auth/RegisterCollege'));
const Onboarding = lazy(() => import('../pages/onboarding/Onboarding'));

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to correct dashboard if wrong role
    if (role === 'super_admin') return <Navigate to="/super-admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  // If already logged in, redirect to their dashboard
  if (isAuthenticated) {
    if (role === 'super_admin') return <Navigate to="/super-admin" replace />;
    return <Navigate to="/" replace />;
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
      {/* Auth Routes â€” only accessible when NOT logged in */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterCollege />} />
      </Route>
      
      {/* College Admin Routes â€” protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRole="college_admin">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="students" element={<Students />} />
        <Route path="search" element={<Search />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Super Admin Routes â€” protected */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="colleges" element={<Colleges />} />
        <Route path="college-admins" element={<CollegeAdmins />} />
        <Route path="students" element={<Students />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Onboarding — shown right after college self-registration */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Catch-all â€” redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;


