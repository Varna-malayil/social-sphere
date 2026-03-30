// src/pages/admin/AdminReports.tsx
import React, { useState } from 'react';
import { Avatar, Button, Select, Table, Tag, Modal, Input, message } from 'antd';
import { FlagOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAdminReports } from '@/hooks/useQueries';
import { adminAPI } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Report } from '@/types';

const REASON_LABELS: Record<string, string> = {
  spam: '🚫 Spam',
  harassment: '😡 Harassment',
  hate_speech: '🤬 Hate Speech',
  violence: '⚠️ Violence',
  nudity: '🔞 Nudity',
  misinformation: '❌ Misinformation',
  copyright: '©️ Copyright',
  other: '📋 Other',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  reviewed: 'blue',
  resolved: 'green',
  dismissed: 'default',
};

const AdminReports: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [resolveModal, setResolveModal] = useState<{ open: boolean; report: Report | null }>({
    open: false, report: null,
  });
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved',
    actionTaken: 'none',
    adminNotes: '',
  });
  const [resolving, setResolving] = useState(false);

  const { data, isLoading } = useAdminReports(page, statusFilter);
  const reports = data?.data || [];

  const handleResolve = async () => {
    if (!resolveModal.report) return;
    setResolving(true);
    try {
      await adminAPI.resolveReport(resolveModal.report._id, resolveForm);
      message.success('Report resolved');
      qc.invalidateQueries({ queryKey: ['adminReports'] });
      qc.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setResolveModal({ open: false, report: null });
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  };

  const openResolve = (report: Report) => {
    setResolveForm({ status: 'resolved', actionTaken: 'none', adminNotes: '' });
    setResolveModal({ open: true, report });
  };

  const columns = [
    {
      title: 'Reporter',
      key: 'reporter',
      width: 160,
      render: (_: any, r: Report) => (
        <div className="flex items-center gap-2">
          <Avatar src={r.reporter?.avatar} size={28} style={{ background: 'var(--accent)', flexShrink: 0 }}>
            {r.reporter?.username?.[0]?.toUpperCase()}
          </Avatar>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>@{r.reporter?.username}</span>
        </div>
      ),
    },
    {
      title: 'Type & Reason',
      key: 'reason',
      render: (_: any, r: Report) => (
        <div className="space-y-1">
          <Tag style={{ textTransform: 'capitalize' }}>{r.reportType}</Tag>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {REASON_LABELS[r.reason] || r.reason}
          </div>
        </div>
      ),
    },
    {
      title: 'Reported Content',
      key: 'content',
      render: (_: any, r: Report) => (
        <div className="text-xs space-y-1">
          {r.reportedUser && (
            <div>
              User:{' '}
              <Link to={`/profile/${r.reportedUser.username}`}
                className="hover:underline" style={{ color: 'var(--accent)' }}>
                @{r.reportedUser.username}
              </Link>
            </div>
          )}
          {r.reportedPost && (
            <div>
              <Link to={`/posts/${r.reportedPost._id}`}
                className="hover:underline" style={{ color: 'var(--accent)' }}>
                View Post
              </Link>
              {r.reportedPost.content && (
                <span style={{ color: 'var(--text-muted)' }}>
                  {' '}— "{r.reportedPost.content.substring(0, 50)}{r.reportedPost.content.length > 50 ? '…' : ''}"
                </span>
              )}
            </div>
          )}
          {r.description && (
            <div style={{ color: 'var(--text-muted)' }}>"{r.description.substring(0, 80)}{r.description.length > 80 ? '…' : ''}"</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: any, r: Report) => (
        <Tag color={STATUS_COLORS[r.status] || 'default'} style={{ textTransform: 'capitalize' }}>
          {r.status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{dayjs(d).format('MMM D, YYYY')}</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, r: Report) => (
        r.status === 'pending' ? (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => openResolve(r)}
            style={{ borderRadius: 8 }}>
            Review
          </Button>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {r.actionTaken || 'No action'}
          </span>
        )
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {data?.total ?? 0} total reports
          </p>
        </div>
        <Select
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'pending',  label: '🟡 Pending' },
            { value: 'reviewed', label: '🔵 Reviewed' },
            { value: 'resolved', label: '🟢 Resolved' },
            { value: 'dismissed', label: '⚫ Dismissed' },
          ]}
        />
      </div>

      <div className="card overflow-hidden">
        <Table
          dataSource={reports}
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
        />
      </div>

      {/* Resolve Modal */}
      <Modal
        open={resolveModal.open}
        onCancel={() => setResolveModal({ open: false, report: null })}
        title={<span style={{ color: 'var(--text-primary)' }}>Resolve Report</span>}
        onOk={handleResolve}
        okText="Submit Resolution"
        confirmLoading={resolving}>
        <div className="py-2 space-y-4">
          {resolveModal.report && (
            <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)' }}>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Report: </strong>
                {REASON_LABELS[resolveModal.report.reason] || resolveModal.report.reason}
              </div>
              {resolveModal.report.description && (
                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  "{resolveModal.report.description}"
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Resolution Status
            </label>
            <Select
              value={resolveForm.status}
              onChange={(v) => setResolveForm({ ...resolveForm, status: v })}
              style={{ width: '100%' }}
              options={[
                { value: 'resolved',  label: '✅ Resolved' },
                { value: 'dismissed', label: '❌ Dismissed (no violation)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Action Taken
            </label>
            <Select
              value={resolveForm.actionTaken}
              onChange={(v) => setResolveForm({ ...resolveForm, actionTaken: v })}
              style={{ width: '100%' }}
              options={[
                { value: 'none',            label: 'No action' },
                { value: 'content_removed', label: '🗑️ Remove Content' },
                { value: 'user_warned',     label: '⚠️ Warn User' },
                { value: 'user_banned',     label: '🚫 Ban User' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Admin Notes (optional)
            </label>
            <Input.TextArea
              value={resolveForm.adminNotes}
              onChange={(e) => setResolveForm({ ...resolveForm, adminNotes: e.target.value })}
              placeholder="Internal notes about this review..."
              autoSize={{ minRows: 2 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReports;
