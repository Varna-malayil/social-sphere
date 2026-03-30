// src/pages/HomePage.tsx
import React, { useState } from 'react';
import { Spin, Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useFeed, useSuggestions } from '@/hooks/useQueries';
import PostCard from '@/components/feed/PostCard';
import CreatePostModal from '@/components/feed/CreatePostModal';
import UserSuggestions from '@/components/common/UserSuggestions';


const SkeletonPost = () => (
  <div className="card p-4 mb-4 space-y-3">
    <div className="flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-2 w-24 rounded" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
    </div>
    <div className="skeleton h-48 w-full rounded-xl" />
  </div>
);

const HomePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, isError } = useFeed(page);

  const posts = data?.data || [];
  const hasMore = data ? page < data.pages : false;

  if (isError) return (
    <div className="text-center py-20">
      <p style={{ color: 'var(--text-secondary)' }}>Failed to load feed</p>
      <Button type="link" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  return (
    <div className="flex gap-6">
      {/* Feed */}
      <div className="flex-1 min-w-0">
        {/* Compose bar */}
        <div className="card p-4 mb-4 flex items-center gap-3 cursor-pointer hover:border-[var(--accent)] transition-colors"
          onClick={() => setShowCreate(true)}>
          <div className="flex-1 rounded-full px-4 py-2.5 text-sm"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            What's on your mind?
          </div>
          <Button type="primary" icon={<PlusOutlined />} shape="circle" size="small" />
        </div>

        {isLoading ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : posts.length === 0 ? (
          <div className="card p-12">
            <Empty
              description={
                <span style={{ color: 'var(--text-secondary)' }}>
                  Your feed is empty — follow some users or create a post!
                </span>
              }
            />
          </div>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post._id} post={post} />)}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button onClick={() => setPage((p) => p + 1)} loading={isLoading}
                  style={{ borderRadius: 20, color: 'var(--text-secondary)' }}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 flex-shrink-0">
        <UserSuggestions />
      </aside>

      <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default HomePage;
