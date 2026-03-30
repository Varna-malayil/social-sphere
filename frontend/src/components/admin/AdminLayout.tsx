// src/components/admin/AdminLayout.tsx
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined, UserOutlined, FileTextOutlined,
  FlagOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin',         icon: <DashboardOutlined />, label: 'Dashboard', end: true },
    { to: '/admin/users',   icon: <UserOutlined />,      label: 'Users' },
    { to: '/admin/posts',   icon: <FileTextOutlined />,  label: 'Posts' },
    { to: '/admin/reports', icon: <FlagOutlined />,      label: 'Reports' },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-40 border-r"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded font-semibold"
              style={{ background: '#fbbf2420', color: '#fbbf24' }}>ADMIN</span>
          </div>
          <h1 className="font-bold text-lg text-gradient">SocialSphere</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: '#fbbf2415', color: '#fbbf24' }
                  : { color: 'var(--text-secondary)' }
              }>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm w-full px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeftOutlined /> Back to App
          </button>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
