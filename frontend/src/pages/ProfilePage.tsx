// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Button, Tabs, Modal, Input, Spin, Empty } from 'antd';
import {
  EditOutlined, LinkOutlined, EnvironmentOutlined,
  CalendarOutlined, CheckCircleFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUserProfile, useUserPosts, useFollowUser, useUpdateProfile } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/authStore';
import PostCard from '@/components/feed/PostCard';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: me, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useUserProfile(username!);
  const { data: postsData, isLoading: postsLoading } = useUserPosts(profile?._id || '', 1);
  const followUser = useFollowUser();
  const updateProfile = useUpdateProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', website: '', location: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const isMe = me?.username === username;
  const isFollowing = me && profile?.followers?.some((f: any) =>
    (typeof f === 'string' ? f : f._id) === me._id
  );

  const handleFollow = () => {
    if (!profile) return;
    followUser.mutate(profile._id);
  };

  const openEdit = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
      location: profile?.location || '',
    });
    setAvatarPreview(profile?.avatar || '');
    setEditOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const fd = new FormData();
    fd.append('displayName', editForm.displayName);
    fd.append('bio', editForm.bio);
    fd.append('website', editForm.website);
    fd.append('location', editForm.location);
    if (avatarFile) fd.append('avatar', avatarFile);
    updateProfile.mutate(fd, {
      onSuccess: (data) => {
        updateUser(data as any);
        setEditOpen(false);
      },
    });
  };

  if (profileLoading) return (
    <div className="flex justify-center py-20"><Spin size="large" /></div>
  );
  if (!profile) return (
    <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>User not found</div>
  );

  return (
    <div className="animate-fade-in">
      {/* Cover / Header */}
      <div className="card overflow-hidden mb-4">
        {/* Cover gradient */}
        <div className="h-36 w-full" style={{
          background: `linear-gradient(135deg, var(--accent-dim), #1a1a2e)`,
        }} />

        {/* Profile info */}
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar
              src={profile.avatar}
              size={84}
              className="ring-4"
              style={{ border: '4px solid var(--bg-card)', background: 'var(--accent)', flexShrink: 0 }}>
              {profile.displayName?.[0]?.toUpperCase()}
            </Avatar>

            <div className="flex gap-2 pb-1">
              {isMe ? (
                <Button icon={<EditOutlined />} onClick={openEdit}
                  style={{ borderRadius: 20, background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  Edit Profile
                </Button>
              ) : (
                <Button
                  type={isFollowing ? 'default' : 'primary'}
                  loading={followUser.isPending}
                  onClick={handleFollow}
                  style={{ borderRadius: 20, ...(isFollowing ? { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' } : {}) }}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>

          {/* Name & handle */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {profile.displayName}
              </h1>
              {profile.isVerified && (
                <CheckCircleFilled style={{ color: 'var(--accent)', fontSize: 16 }} />
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
              {profile.bio}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-4">
            {profile.location && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <EnvironmentOutlined /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
                <LinkOutlined /> {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <CalendarOutlined /> Joined {dayjs(profile.createdAt).format('MMMM YYYY')}
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { label: 'Posts', value: profile.postsCount },
              { label: 'Followers', value: profile.followersCount },
              { label: 'Following', value: profile.followingCount },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
                <span className="ml-1 text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>POSTS</h3>
        {postsLoading ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : postsData?.data?.length === 0 ? (
          <div className="card p-10">
            <Empty description={<span style={{ color: 'var(--text-secondary)' }}>No posts yet</span>} />
          </div>
        ) : (
          postsData?.data?.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        title={<span style={{ color: 'var(--text-primary)' }}>Edit Profile</span>}
        onOk={handleSaveProfile}
        okText="Save"
        confirmLoading={updateProfile.isPending}
        okButtonProps={{ style: { borderRadius: 10 } }}
      >
        <div className="space-y-4 py-2">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar src={avatarPreview} size={64} style={{ background: 'var(--accent)' }}>
              {editForm.displayName?.[0]?.toUpperCase()}
            </Avatar>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <span className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
                Change Photo
              </span>
            </label>
          </div>

          {[
            { key: 'displayName', label: 'Display Name', placeholder: 'Your name' },
            { key: 'bio', label: 'Bio', placeholder: 'Tell people about yourself', textarea: true },
            { key: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
            { key: 'location', label: 'Location', placeholder: 'City, Country' },
          ].map(({ key, label, placeholder, textarea }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              {textarea ? (
                <Input.TextArea
                  value={editForm[key as keyof typeof editForm]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  autoSize={{ minRows: 3 }}
                  maxLength={500}
                  showCount
                />
              ) : (
                <Input
                  value={editForm[key as keyof typeof editForm]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
