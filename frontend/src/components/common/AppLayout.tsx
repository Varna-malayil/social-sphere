// src/components/common/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Badge, Avatar, Dropdown, Input } from 'antd';
import {
  HomeOutlined, CompassOutlined, MessageOutlined, BellOutlined,
  UserOutlined, SettingOutlined, LogoutOutlined, SearchOutlined,
  CrownOutlined, PlusOutlined, MenuOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useQueries';
import CreatePostModal from '@/components/feed/CreatePostModal';
import { Drawer } from 'antd';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const { data: notifData } = useNotifications();
  const unread = notifData?.unreadCount || 0;

  const navItems = [
    { to: '/',             icon: <HomeOutlined />,    label: 'Home' },
    { to: '/explore',      icon: <CompassOutlined />, label: 'Explore' },
    { to: '/chat',         icon: <MessageOutlined />, label: 'Messages' },
    { to: '/notifications',icon: <BellOutlined />,    label: 'Notifications', badge: unread },
    { to: `/profile/${user?.username}`, icon: <UserOutlined />, label: 'Profile' },
  ];

  const userMenuItems = [
    { key: 'profile', label: 'Your Profile', icon: <UserOutlined /> },
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    ...(user?.role === 'admin' ? [{ key: 'admin', label: 'Admin Panel', icon: <CrownOutlined /> }] : []),
    { type: 'divider' as const },
    { key: 'logout', label: 'Log Out', icon: <LogoutOutlined />, danger: true },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setDrawerOpen(false);
    if (key === 'logout') { logout(); navigate('/login'); }
    else if (key === 'profile') navigate(`/profile/${user?.username}`);
    else if (key === 'settings') navigate('/settings');
    else if (key === 'admin') navigate('/admin');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQ.trim()) {
      navigate(`/explore?q=${searchQ.trim()}`);
      setDrawerOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      {/* Logo */}
      <div className="p-6 mb-2 hidden lg:block">
        <h1 className="text-xl font-bold text-gradient cursor-pointer" onClick={() => navigate('/')}>
          ✦ SocialSphere
        </h1>
      </div>

      {/* Search - Desktop only */}
      <div className="px-4 mb-4 hidden lg:block">
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          placeholder="Search users..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={handleSearch}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10 }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-4 lg:mt-0">
        {navItems.map(({ to, icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === '/'}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'text-white' : 'hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'var(--accent-dim)', color: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
          >
            <span className="text-base">
              {badge ? <Badge count={badge} size="small">{icon}</Badge> : icon}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
        {/* Extra items in drawer/mobile */}
        <div className="lg:hidden pt-4 mt-4 border-t border-[var(--border)]">
          <p className="px-4 mb-2 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Account</p>
          <button onClick={() => { navigate('/settings'); setDrawerOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 rounded-xl">
             <SettingOutlined /> Settings
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => { navigate('/admin'); setDrawerOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 rounded-xl">
               <CrownOutlined /> Admin Panel
            </button>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--danger)] hover:bg-white/5 rounded-xl">
             <LogoutOutlined /> Logout
          </button>
        </div>
      </nav>

      {/* Create Post Button - Desktop only */}
      <div className="px-4 pb-4 hidden lg:block">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <PlusOutlined /> New Post
        </button>
      </div>

      {/* User - Desktop only */}
      <div className="p-4 border-t hidden lg:block" style={{ borderColor: 'var(--border)' }}>
        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="topLeft" trigger={['click']}>
          <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
            <Avatar src={user?.avatar} size={36} style={{ background: 'var(--accent)', flexShrink: 0 }}>
              {user?.displayName?.[0]?.toUpperCase()}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.displayName}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                @{user?.username}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-base)' }}>
      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 hidden lg:flex flex-col z-40 border-r"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Header ─────────────────────────────────── */}
      <header className="mobile-header lg:hidden">
        <h1 className="text-lg font-bold text-gradient cursor-pointer" onClick={() => navigate('/')}>
          ✦ SocialSphere
        </h1>
        <div className="flex items-center gap-2">
           <button onClick={() => navigate('/chat')} className="p-2 text-[var(--text-primary)]"><MessageOutlined style={{ fontSize: 20 }} /></button>
           <button onClick={() => setDrawerOpen(true)} className="p-2 text-[var(--text-primary)]"><MenuOutlined style={{ fontSize: 20 }} /></button>
        </div>
      </header>

      {/* ── Mobile Menu Drawer ────────────────────────────────── */}
      <Drawer
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ body: { padding: 0, background: 'var(--bg-card)' } }}
        width={280}
        closeIcon={null}
      >
        <SidebarContent />
      </Drawer>

      {/* ── Mobile Bottom Nav ─────────────────────────────────── */}
      <nav className="mobile-bottom-nav lg:hidden">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <HomeOutlined />
          <span>Home</span>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CompassOutlined />
          <span>Explore</span>
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Badge count={unread} size="small" offset={[2, 0]}>
            <BellOutlined />
          </Badge>
          <span>Alerts</span>
        </NavLink>
        <NavLink to={`/profile/${user?.username}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Avatar src={user?.avatar} size={24} style={{ border: '1px solid currentColor' }}>
             {user?.displayName?.[0]?.toUpperCase()}
          </Avatar>
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* ── Mobile FAB ────────────────────────────────────────── */}
      <button className="fab-button lg:hidden active:scale-90" onClick={() => setShowCreate(true)}>
        <PlusOutlined />
      </button>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-4 lg:py-8 mb-16 lg:mb-0">
          <Outlet />
        </div>
      </main>

      {/* ── Create Post Modal ────────────────────────────────── */}
      <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default AppLayout;
