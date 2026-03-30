// src/components/feed/PostCard.tsx
import React, { useState } from 'react';
import { Avatar, Dropdown, Modal } from 'antd';
import {
  HeartOutlined, HeartFilled, MessageOutlined, MoreOutlined,
  DeleteOutlined, EditOutlined, FlagOutlined, ShareAltOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Post } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useToggleLike, useDeletePost } from '@/hooks/useQueries';
import CommentSection from './CommentSection';

dayjs.extend(relativeTime);

interface Props { post: Post; }

const PostCard: React.FC<Props> = ({ post }) => {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const navigate = useNavigate();

  const isOwner = user?._id === post.author._id;
  const isLiked = post.likes?.includes(user?._id || '');

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike.mutate(post._id);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete this post?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deletePost.mutate(post._id),
    });
  };

  const menuItems = [
    ...(isOwner ? [
      { key: 'edit',   label: 'Edit post',   icon: <EditOutlined /> },
      { key: 'delete', label: 'Delete post',  icon: <DeleteOutlined />, danger: true },
    ] : [
      { key: 'report', label: 'Report post',  icon: <FlagOutlined /> },
    ]),
    { key: 'share', label: 'Copy link', icon: <ShareAltOutlined /> },
  ];

  const handleMenu = ({ key }: { key: string }) => {
    if (key === 'delete') handleDelete();
    if (key === 'share') { navigator.clipboard.writeText(`${window.location.origin}/posts/${post._id}`); }
    if (key === 'edit') navigate(`/posts/${post._id}?edit=true`);
  };

  const imgCount = post.images?.length || 0;

  return (
    <article className="card mb-4 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3 group">
          <Avatar src={post.author.avatar} size={42}
            style={{ background: 'var(--accent)', flexShrink: 0 }}
            className="ring-2 ring-transparent group-hover:ring-[var(--accent)] transition-all">
            {post.author.displayName?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                {post.author.displayName}
              </span>
              {post.author.isVerified && <span className="text-xs" style={{ color: 'var(--accent)' }}>✦</span>}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              @{post.author.username} · {dayjs(post.createdAt).fromNow()}
            </div>
          </div>
        </Link>
        <Dropdown menu={{ items: menuItems, onClick: handleMenu }} trigger={['click']} placement="bottomRight">
          <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }} onClick={(e) => e.stopPropagation()}>
            <MoreOutlined />
          </button>
        </Dropdown>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
            {post.content}
          </p>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  onClick={() => navigate(`/explore?tag=${tag}`)}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {imgCount > 0 && (
        <div className={`post-images-${Math.min(imgCount, 4)} px-4 pb-3`}>
          {post.images.slice(0, 4).map((img, i) => (
            <img key={i} src={img.url} alt=""
              className={imgCount === 3 && i === 0 ? 'first' : ''}
              onClick={() => setLightboxImg(img.url)} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={handleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5 active:scale-95"
          style={{ color: isLiked ? '#f87171' : 'var(--text-secondary)' }}>
          {isLiked ? <HeartFilled /> : <HeartOutlined />}
          <span>{post.likesCount || 0}</span>
        </button>

        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ color: showComments ? 'var(--accent)' : 'var(--text-secondary)' }}>
          <MessageOutlined />
          <span>{post.commentsCount || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <CommentSection postId={post._id} />
        </div>
      )}

      {/* Lightbox */}
      <Modal open={!!lightboxImg} footer={null} onCancel={() => setLightboxImg(null)}
        width="auto" centered
        styles={{ body: { padding: 0 }, content: { background: 'transparent', boxShadow: 'none' } }}>
        {lightboxImg && <img src={lightboxImg} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />}
      </Modal>
    </article>
  );
};

export default PostCard;
