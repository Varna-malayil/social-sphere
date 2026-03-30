// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { Spin, Avatar } from 'antd';
import {
  UserOutlined, FileTextOutlined, FlagOutlined,
  StopOutlined, RiseOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAdminAnalytics } from '@/hooks/useQueries';

const StatCard: React.FC<{
  title: string; value: number | string; sub?: string;
  icon: React.ReactNode; color: string;
}> = ({ title, value, sub, icon, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  </div>
);

const MiniBar: React.FC<{ data: { _id: string; count: number }[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.slice(-14).map((d) => (
        <div key={d._id} className="flex-1 rounded-t transition-all" title={`${d._id}: ${d.count}`}
          style={{ height: `${(d.count / max) * 100}%`, background: color, minHeight: 2, opacity: 0.7 }} />
      ))}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!data) return null;

  const { users, posts, reports, charts, topUsers } = data;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Platform overview and analytics
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users"    value={users.total}    sub={`+${users.last7Days} this week`}   icon={<UserOutlined />}     color="#7c6af7" />
        <StatCard title="Total Posts"    value={posts.total}    sub={`+${posts.last30Days} this month`} icon={<FileTextOutlined />} color="#34d399" />
        <StatCard title="Pending Reports"value={reports.pending} sub={`${reports.total} total`}         icon={<FlagOutlined />}     color="#fbbf24" />
        <StatCard title="Banned Users"   value={users.banned}   sub={`${users.active} online now`}     icon={<StopOutlined />}     color="#f87171" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Signups */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Signups</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#34d399' }}>
              <RiseOutlined />
              <span>{users.last30Days} new</span>
            </div>
          </div>
          {charts.dailySignups.length > 0
            ? <MiniBar data={charts.dailySignups} color="#7c6af7" />
            : <div className="h-16 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>No data</div>
          }
        </div>

        {/* Posts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Posts</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#34d399' }}>
              <RiseOutlined />
              <span>{posts.last30Days} new</span>
            </div>
          </div>
          {charts.dailyPosts.length > 0
            ? <MiniBar data={charts.dailyPosts} color="#34d399" />
            : <div className="h-16 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>No data</div>
          }
        </div>
      </div>

      {/* Top users */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Top Users by Followers
        </h3>
        <div className="space-y-3">
          {topUsers.slice(0, 8).map((u, i) => (
            <div key={u._id} className="flex items-center gap-3">
              <span className="w-6 text-xs text-right font-mono flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </span>
              <Avatar src={u.avatar} size={32} style={{ background: 'var(--accent)', flexShrink: 0 }}>
                {u.displayName?.[0]}
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${u.username}`}
                  className="text-sm font-medium hover:underline truncate block"
                  style={{ color: 'var(--text-primary)' }}>
                  {u.displayName}
                </Link>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</span>
              </div>
              <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--accent)' }}>
                {u.followersCount?.toLocaleString()} followers
              </span>
            </div>
          ))}
          {topUsers.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No users yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
