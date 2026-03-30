// src/routes/index.tsx - All routes with protection
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/common/AppLayout';
import AdminLayout from '@/components/admin/AdminLayout';

// Lazy-loaded pages
const LoginPage      = lazy(() => import('@/pages/LoginPage'));
const RegisterPage   = lazy(() => import('@/pages/RegisterPage'));
const HomePage       = lazy(() => import('@/pages/HomePage'));
const ExplorePage    = lazy(() => import('@/pages/ExplorePage'));
const ProfilePage    = lazy(() => import('@/pages/ProfilePage'));
const PostPage       = lazy(() => import('@/pages/PostPage'));
const ChatPage       = lazy(() => import('@/pages/ChatPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage   = lazy(() => import('@/pages/SettingsPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers     = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminPosts     = lazy(() => import('@/pages/admin/AdminPosts'));
const AdminReports   = lazy(() => import('@/pages/admin/AdminReports'));

const Loader = () => (
  <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-base)' }}>
    <Spin size="large" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {/* Guest-only routes */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected user routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
        <Route path="posts/:id" element={<PostPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="admin"          element={<AdminDashboard />} />
        <Route path="admin/users"    element={<AdminUsers />} />
        <Route path="admin/posts"    element={<AdminPosts />} />
        <Route path="admin/reports"  element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
