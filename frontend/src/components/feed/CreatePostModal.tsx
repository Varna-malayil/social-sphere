// src/components/feed/CreatePostModal.tsx
import React, { useState, useRef } from 'react';
import { Modal, Input, Button, Avatar, Select, Upload } from 'antd';
import { PictureOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCreatePost } from '@/hooks/useQueries';

const { TextArea } = Input;

interface Props { open: boolean; onClose: () => void; }

const CreatePostModal: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuthStore();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - images.length);
    setImages((prev) => [...prev, ...files].slice(0, 4));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string].slice(0, 4));
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;
    const fd = new FormData();
    if (content.trim()) fd.append('content', content.trim());
    fd.append('visibility', visibility);
    images.forEach((img) => fd.append('images', img));
    createPost.mutate(fd, {
      onSuccess: () => {
        setContent(''); setImages([]); setPreviews([]); onClose();
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span style={{ color: 'var(--text-primary)' }}>Create Post</span>}
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
                { value: 'private', label: '🔒 Only me' },
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

        {/* Image previews */}
        {previews.length > 0 && (
          <div className={`post-images-${Math.min(previews.length, 4)}`}>
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" style={{ height: 140, borderRadius: 8, objectFit: 'cover', width: '100%' }} />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                  <CloseOutlined />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={images.length >= 4}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5 disabled:opacity-40"
              style={{ color: 'var(--text-secondary)' }}>
              <PictureOutlined />
              <span>Photo {images.length > 0 ? `(${images.length}/4)` : ''}</span>
            </button>
          </div>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createPost.isPending}
            disabled={!content.trim() && images.length === 0}
            style={{ borderRadius: 20, paddingLeft: 24, paddingRight: 24 }}>
            Post
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePostModal;
