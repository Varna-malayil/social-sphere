// src/components/common/UserCard.tsx
import React from 'react';
import { Avatar, Button } from 'antd';
import { Link } from 'react-router-dom';
import { UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import type { User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useFollowUser } from '@/hooks/useQueries';

interface Props {
  user: User;
  compact?: boolean;
}

const UserCard: React.FC<Props> = ({ user, compact }) => {
  const { user: me } = useAuthStore();
  const followUser = useFollowUser();

  const isMe = me?._id === user._id;
  const isFollowing = Array.isArray(user.followers)
    ? user.followers.some((f: any) => (typeof f === 'string' ? f : f._id) === me?._id)
    : false;

  return (
    <div
      className="card p-4 flex items-center justify-between gap-3 hover:border-[var(--accent)]/30 transition-colors"
      style={{ borderColor: 'var(--border)' }}>
      <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <Avatar src={user.avatar} size={compact ? 36 : 44} style={{ background: 'var(--accent)' }}>
            {user.displayName?.[0]?.toUpperCase()}
          </Avatar>
          {user.isOnline && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: 'var(--online)', borderColor: 'var(--bg-card)' }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {user.displayName}
            </span>
            {user.isVerified && <span className="text-xs flex-shrink-0" style={{ color: 'var(--accent)' }}>✦</span>}
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            @{user.username}
            {!compact && user.followersCount != null && (
              <span className="ml-2">{user.followersCount.toLocaleString()} followers</span>
            )}
          </p>
        </div>
      </Link>

      {!isMe && (
        <Button
          size="small"
          type={isFollowing ? 'default' : 'primary'}
          icon={isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
          loading={followUser.isPending}
          onClick={(e) => { e.preventDefault(); followUser.mutate(user._id); }}
          style={{ borderRadius: 16, flexShrink: 0 }}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </div>
  );
};

export default UserCard;
