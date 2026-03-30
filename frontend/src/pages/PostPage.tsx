// src/pages/PostPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { usePost } from '@/hooks/useQueries';
import PostCard from '@/components/feed/PostCard';

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading } = usePost(id!);

  return (
    <div className="animate-fade-in">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
        className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Back
      </Button>
      {isLoading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : !post ? (
        <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>Post not found</div>
      ) : (
        <PostCard post={post} />
      )}
    </div>
  );
};

export default PostPage;
