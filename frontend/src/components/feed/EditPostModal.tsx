// src/components/feed/EditPostModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Avatar, Select } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useUpdatePost } from '@/hooks/useQueries';
import type { Post } from '@/types';

const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  post: Post;
}

const EditPostModal: React.FC<Props> = ({ open, onClose, post }) => {
  const { user } = useAuthStore();
  const updatePost = useUpdatePost();
  const [content, setContent] = useState(post.content || '');
  const [visibility, setVisibility] = useState<'public' | 'followers'>(post.visibility as any || 'public');
  const [tags, setTags] = useState(post.tags?.join(', ') || '');

  useEffect(() => {
    if (open) {
      setContent(post.content || '');
      setVisibility(post.visibility as any || 'public');
      setTags(post.tags?.join(', ') || '');
    }
  }, [open, post]);

  const handleSubmit = () => {
    if (!content.trim() && (!post.images || post.images.length === 0)) return;
    
    updatePost.mutate({
      id: post._id,
      data: {
        content: content.trim(),
        visibility,
        tags: tags,
      },
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span style={{ color: 'var(--text-primary)' }}>Edit Post</span>}
      width={520}
    >
      <div className="space-y-4 pt-2">
        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} size={44} style={{ background: 'var(--accent)' }}>
            {user?.displayName?.[0]}
          </Avatar>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {user?.displayName}
            </div>
            <Select
              value={visibility}
              onChange={setVisibility}
              size="small"
              style={{ width: 120 }}
              options={[
                { value: 'public', label: '🌍 Public' },
                { value: 'followers', label: '👥 Followers' },
              ]}
            />
          </div>
        </div>

        {/* Text area */}
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          autoSize={{ minRows: 3, maxRows: 8 }}
          maxLength={2000}
          showCount
          style={{ background: 'transparent', border: 'none', resize: 'none', fontSize: 15, padding: '4px 0' }}
        />

        {/* Tags */}
        <div className="space-y-1">
          <label className="text-xs font-semibold px-1" style={{ color: 'var(--text-muted)' }}>Tags (comma separated)</label>
          <Input 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            placeholder="e.g. nature, photography, art"
            style={{ borderRadius: 8 }}
          />
        </div>

        {/* Images Preview (Read Only in Edit for now) */}
        {post.images && post.images.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold px-1" style={{ color: 'var(--text-muted)' }}>Images (cannot be changed during edit)</label>
            <div className={`post-images-${Math.min(post.images.length, 4)}`}>
              {post.images.map((img, i) => (
                <img key={i} src={img.url} alt="" style={{ height: 100, borderRadius: 8, objectFit: 'cover', width: '100%' }} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={updatePost.isPending}
            disabled={!content.trim() && (!post.images || post.images.length === 0)}
            style={{ borderRadius: 20, paddingLeft: 24, paddingRight: 24 }}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditPostModal;
