// src/pages/admin/AdminPosts.tsx
import React, { useState } from 'react';
import { Avatar, Button, Switch, Table, Tag, Modal, message, Image } from 'antd';
import { DeleteOutlined, FlagOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAdminPosts } from '@/hooks/useQueries';
import { adminAPI } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Post } from '@/types';

const AdminPosts: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [reportedOnly, setReportedOnly] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useAdminPosts(page, reportedOnly || undefined);
  const posts = data?.data || [];

  const handleDelete = (post: Post) => {
    Modal.confirm({
      title: 'Remove this post?',
      content: (
        <div>
          <p style={{ color: 'var(--text-secondary)' }}>
            This will permanently hide the post by <strong>@{post.author?.username}</strong>.
          </p>
          {post.content && (
            <p className="mt-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>
              "{post.content.substring(0, 120)}{post.content.length > 120 ? '…' : ''}"
            </p>
          )}
        </div>
      ),
      okText: 'Remove Post',
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleting(post._id);
        try {
          await adminAPI.deletePost(post._id);
          message.success('Post removed');
          qc.invalidateQueries({ queryKey: ['adminPosts'] });
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Failed to remove post');
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const columns = [
    {
      title: 'Author',
      key: 'author',
      width: 180,
      render: (_: any, post: Post) => (
        <div className="flex items-center gap-2">
          <Avatar src={post.author?.avatar} size={32} style={{ background: 'var(--accent)', flexShrink: 0 }}>
            {post.author?.displayName?.[0]}
          </Avatar>
          <div className="min-w-0">
            <Link to={`/profile/${post.author?.username}`}
              className="text-xs font-medium hover:underline truncate block"
              style={{ color: 'var(--text-primary)' }}>
              {post.author?.displayName}
            </Link>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{post.author?.username}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      key: 'content',
      render: (_: any, post: Post) => (
        <div>
          {post.content ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {post.content.substring(0, 100)}{post.content.length > 100 ? '…' : ''}
            </p>
          ) : (
            <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Image-only post</span>
          )}
          {post.images?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {post.images.slice(0, 3).map((img, i) => (
                <Image
                  key={i}
                  src={img.url}
                  width={40}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  preview={{ mask: <EyeOutlined /> }}
                />
              ))}
              {post.images.length > 3 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  +{post.images.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Stats',
      key: 'stats',
      width: 120,
      render: (_: any, post: Post) => (
        <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <div>❤️ {post.likesCount ?? 0}</div>
          <div>💬 {post.commentsCount ?? 0}</div>
        </div>
      ),
    },
    {
      title: 'Flags',
      key: 'flags',
      width: 100,
      render: (_: any, post: Post) => (
        <div>
          {post.isReported ? (
            <Tag color="orange" icon={<FlagOutlined />}>{post.reportCount} report{post.reportCount !== 1 ? 's' : ''}</Tag>
          ) : (
            <Tag color="default">Clean</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {dayjs(d).format('MMM D, YYYY')}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, post: Post) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          loading={deleting === post._id}
          onClick={() => handleDelete(post)}
          style={{ borderRadius: 8 }}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Posts</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {data?.total ?? 0} total posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={reportedOnly}
              onChange={(v) => { setReportedOnly(v); setPage(1); }}
              size="small"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Reported only
            </span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <Table
          dataSource={posts}
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
          rowClassName={(record: Post) => record.isReported ? 'reported-row' : ''}
        />
      </div>
    </div>
  );
};

export default AdminPosts;
