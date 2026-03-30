// src/pages/admin/AdminUsers.tsx
import React, { useState } from 'react';
import { Avatar, Button, Input, Select, Table, Tag, Modal, message } from 'antd';
import { SearchOutlined, StopOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAdminUsers } from '@/hooks/useQueries';
import { adminAPI } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';

const AdminUsers: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [banModal, setBanModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data, isLoading } = useAdminUsers(page, search || undefined, status);
  const users = data?.data || [];

  const handleToggleBan = async () => {
    if (!banModal.user) return;
    setActionLoading(true);
    try {
      await adminAPI.toggleBanUser(banModal.user._id, banReason || undefined);
      message.success(banModal.user.isBanned ? 'User unbanned' : 'User banned');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      setBanModal({ open: false, user: null });
      setBanReason('');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, u: User) => (
        <div className="flex items-center gap-3">
          <Avatar src={u.avatar} size={36} style={{ background: 'var(--accent)', flexShrink: 0 }}>
            {u.displayName?.[0]}
          </Avatar>
          <div>
            <Link to={`/profile/${u.username}`}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--text-primary)' }}>
              {u.displayName}
            </Link>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{email}</span>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_: any, u: User) => (
        <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
          <div>{u.postsCount ?? 0} posts</div>
          <div>{u.followersCount ?? 0} followers</div>
        </div>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {dayjs(d).format('MMM D, YYYY')}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, u: User) => (
        <div className="flex flex-col gap-1">
          {u.isBanned ? (
            <Tag color="red" icon={<StopOutlined />}>Banned</Tag>
          ) : (
            <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
          )}
          {u.isOnline && <Tag color="cyan">Online</Tag>}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, u: User) => (
        <Button
          size="small"
          danger={!u.isBanned}
          type={u.isBanned ? 'default' : 'primary'}
          icon={u.isBanned ? <CheckCircleOutlined /> : <StopOutlined />}
          onClick={() => setBanModal({ open: true, user: u })}
          style={{ borderRadius: 8 }}>
          {u.isBanned ? 'Unban' : 'Ban'}
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Users</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {data?.total ?? 0} total users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 220, borderRadius: 10 }}
            allowClear
          />
          <Select
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            placeholder="Filter status"
            allowClear
            style={{ width: 140 }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'banned', label: 'Banned' },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <Table
          dataSource={users}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: page,
            total: data?.total ?? 0,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
            style: { padding: '16px' },
          }}
          style={{ background: 'transparent' }}
          className="admin-table"
        />
      </div>

      {/* Ban / Unban Modal */}
      <Modal
        open={banModal.open}
        onCancel={() => { setBanModal({ open: false, user: null }); setBanReason(''); }}
        title={
          <span style={{ color: 'var(--text-primary)' }}>
            {banModal.user?.isBanned ? 'Unban' : 'Ban'} @{banModal.user?.username}
          </span>
        }
        onOk={handleToggleBan}
        okText={banModal.user?.isBanned ? 'Unban User' : 'Ban User'}
        okButtonProps={{ danger: !banModal.user?.isBanned, loading: actionLoading }}
      >
        {!banModal.user?.isBanned && (
          <div className="py-2">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Reason (optional)
            </label>
            <Input.TextArea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Explain why this user is being banned..."
              autoSize={{ minRows: 2 }}
            />
          </div>
        )}
        {banModal.user?.isBanned && (
          <p className="py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to unban <strong>@{banModal.user?.username}</strong>?
            They will regain full access to the platform.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
