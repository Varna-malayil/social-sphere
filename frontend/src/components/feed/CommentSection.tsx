// src/components/feed/CommentSection.tsx
import React, { useState } from 'react';
import { Avatar, Input, Button, Spin } from 'antd';
import { SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/authStore';
import type { Comment } from '@/types';

dayjs.extend(relativeTime);

const CommentItem: React.FC<{
  comment: Comment;
  postId: string;
  onReply: (id: string, username: string) => void;
}> = ({ comment, postId, onReply }) => {
  const { user } = useAuthStore();
  const deleteComment = useDeleteComment(postId);
  const isOwner = user?._id === comment.author._id;

  return (
    <div className="flex gap-2.5 animate-fade-in">
      <Link to={`/profile/${comment.author.username}`}>
        <Avatar src={comment.author.avatar} size={30}
          style={{ background: 'var(--accent)', flexShrink: 0 }}>
          {comment.author.displayName?.[0]}
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl px-3 py-2 inline-block max-w-full"
          style={{ background: 'var(--bg-elevated)' }}>
          <Link to={`/profile/${comment.author.username}`}
            className="text-xs font-semibold block" style={{ color: 'var(--accent)' }}>
            {comment.author.displayName}
          </Link>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {dayjs(comment.createdAt).fromNow()}
          </span>
          <button className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}
            onClick={() => onReply(comment._id, comment.author.username)}>
            Reply
          </button>
          {isOwner && (
            <button className="text-xs hover:text-red-400 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => deleteComment.mutate(comment._id)}>
              <DeleteOutlined />
            </button>
          )}
        </div>
        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l" style={{ borderColor: 'var(--border)' }}>
            {comment.replies.filter(r => !r.isDeleted).map((reply) => (
              <CommentItem key={reply._id} comment={reply} postId={postId} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentSection: React.FC<{ postId: string }> = ({ postId }) => {
  const { user } = useAuthStore();
  const { data, isLoading } = useComments(postId);
  const addComment = useAddComment(postId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  const handleSubmit = () => {
    const content = text.trim();
    if (!content) return;
    addComment.mutate(
      { content, parentCommentId: replyTo?.id },
      { onSuccess: () => { setText(''); setReplyTo(null); } }
    );
  };

  if (isLoading) return <div className="flex justify-center py-4"><Spin size="small" /></div>;

  const comments = data?.data || [];

  return (
    <div className="space-y-3">
      {/* Comment input */}
      <div className="flex gap-2.5">
        <Avatar src={user?.avatar} size={30} style={{ background: 'var(--accent)', flexShrink: 0 }}>
          {user?.displayName?.[0]}
        </Avatar>
        <div className="flex-1">
          {replyTo && (
            <div className="flex items-center gap-2 mb-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Replying to <span style={{ color: 'var(--accent)' }}>@{replyTo.username}</span></span>
              <button onClick={() => setReplyTo(null)} className="hover:text-red-400">✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPressEnter={handleSubmit}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Write a comment...'}
              style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20 }}
            />
            <Button type="primary" shape="circle" icon={<SendOutlined />}
              loading={addComment.isPending} onClick={handleSubmit} disabled={!text.trim()} />
          </div>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onReply={(id, username) => setReplyTo({ id, username })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
