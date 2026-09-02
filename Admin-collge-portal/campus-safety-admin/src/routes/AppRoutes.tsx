import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import ReportsList from '../pages/reports/ReportsList';
import ReportDetail from '../pages/reports/ReportDetail';
import Students from '../pages/students/Students';
import Search from '../pages/search/Search';
import Notifications from '../pages/notifications/Notifications';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Super Admin Pages
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import Colleges from '../pages/super-admin/Colleges';
import CollegeAdmins from '../pages/super-admin/CollegeAdmins';
import AuditLogs from '../pages/super-admin/AuditLogs';
import RegisterCollege from '../pages/auth/RegisterCollege';
import Onboarding from '../pages/onboarding/Onboarding';

import { useAuth } from '../context/AuthContext';

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

const AppRoutes = () => {
  return (
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
  );
};

export default AppRoutes;


