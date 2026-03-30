// src/pages/NotificationsPage.tsx
import React from 'react';
import { Avatar, Button, Spin, Empty, Badge } from 'antd';
import {
  HeartOutlined, MessageOutlined, UserAddOutlined,
  BellOutlined, CheckOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications, useMarkAllRead } from '@/hooks/useQueries';
import { notificationsAPI } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types';

dayjs.extend(relativeTime);

const iconMap: Record<string, React.ReactNode> = {
  like: <HeartOutlined style={{ color: '#f87171' }} />,
  comment: <MessageOutlined style={{ color: '#60a5fa' }} />,
  follow: <UserAddOutlined style={{ color: '#34d399' }} />,
  reply: <MessageOutlined style={{ color: '#a78bfa' }} />,
  system: <BellOutlined style={{ color: '#fbbf24' }} />,
  mention: <MessageOutlined style={{ color: '#fb923c' }} />,
  repost: <CheckOutlined style={{ color: '#34d399' }} />,
  message: <MessageOutlined style={{ color: '#60a5fa' }} />,
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const qc = useQueryClient();

  const handleClick = () => {
    if (!notification.isRead) {
      notificationsAPI.markAsRead(notification._id).then(() => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      });
    }
  };

  const linkTarget = notification.post
    ? `/posts/${notification.post._id}`
    : notification.type === 'follow'
    ? `/profile/${notification.sender.username}`
    : '#';

  return (
    <Link to={linkTarget} onClick={handleClick}
      className={`flex items-start gap-3 p-4 rounded-xl transition-all hover:opacity-90 ${
        !notification.isRead ? 'border-l-2' : ''
      }`}
      style={{
        background: notification.isRead ? 'var(--bg-card)' : 'var(--accent-dim)',
        borderLeftColor: notification.isRead ? 'transparent' : 'var(--accent)',
        marginBottom: 8,
      }}>
      <div className="relative flex-shrink-0">
        <Avatar src={notification.sender.avatar} size={42}
          style={{ background: 'var(--accent)' }}>
          {notification.sender.displayName?.[0]}
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ background: 'var(--bg-elevated)' }}>
          {iconMap[notification.type] || <BellOutlined />}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
          <span className="font-semibold">{notification.sender.displayName}</span>
          {' '}
          <span style={{ color: 'var(--text-secondary)' }}>{notification.message}</span>
        </div>

        {notification.post?.content && (
          <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
            "{notification.post.content.substring(0, 60)}{notification.post.content.length > 60 ? '…' : ''}"
          </div>
        )}

        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {dayjs(notification.createdAt).fromNow()}
        </div>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
          style={{ background: 'var(--accent)' }} />
      )}
    </Link>
  );
};

const NotificationsPage: React.FC = () => {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();

  const notifications = data?.data || [];
  const unread = data?.unreadCount || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
          {unread > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {unread} unread
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={() => markAll.mutate()}
            loading={markAll.isPending}
            style={{ borderRadius: 16, color: 'var(--accent)', borderColor: 'var(--accent)' }}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12">
          <Empty
            image={<BellOutlined style={{ fontSize: 48, color: 'var(--text-muted)' }} />}
            description={<span style={{ color: 'var(--text-secondary)' }}>No notifications yet</span>}
          />
        </div>
      ) : (
        <div>
          {notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
