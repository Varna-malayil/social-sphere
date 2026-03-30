// src/pages/ExplorePage.tsx
import React, { useState, useEffect } from 'react';
import { Input, Tabs, Empty, Button, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useExplore, useSearchUsers } from '@/hooks/useQueries';
import PostCard from '@/components/feed/PostCard';
import UserCard from '@/components/common/UserCard';


const ExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  // Default to 'posts' if no initial search, otherwise 'users' if 'q' exists
  const [activeTab, setActiveTab] = useState(searchParams.get('q') ? 'users' : 'posts');
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading: postsLoading } = useExplore(page, tag || q || undefined);
  const { data: usersData, isLoading: usersLoading } = useSearchUsers(q);

  const trendingTags = ['tech', 'design', 'art', 'music', 'photography', 'travel', 'food', 'sports'];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tag) params.set('tag', tag);
      navigate({ search: params.toString() }, { replace: true });
    }, 400);
    return () => clearTimeout(timeout);
  }, [q, tag, navigate]);

  const handleSearchChange = (val: string) => {
    setQ(val);
    setTag('');
    // Only switch to users if user is currently on an empty state or just starting to type
    // and we want to encourage finding people. But if they are searching, maybe they want posts.
    // Let's make it smarter: if they've explicitly switched to posts, stay there.
    if (val && activeTab === 'posts' && !tag) {
      // stay on posts
    } else if (val && activeTab !== 'users') {
      setActiveTab('users');
    } else if (!val) {
      setActiveTab('posts');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-20 sm:pb-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--text-primary)' }}>
        Explore
      </h2>

      {/* Search bar */}
      <div className="card p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          placeholder="Search posts, users, tags..."
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="large"
          className="search-input-responsive"
          style={{ borderRadius: 12 }}
          allowClear
        />
      </div>

      {/* Trending tags */}
      {!q && (
        <div className="card p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
          <p className="text-[10px] sm:text-xs font-bold mb-3 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            Trending Tags
          </p>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {trendingTags.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTag(t);
                  setQ('');
                  setActiveTab('posts');
                }}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all hover:opacity-80 active:scale-95"
                style={{
                  background: tag === t ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: tag === t ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${tag === t ? 'transparent' : 'var(--border)'}`,
                }}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="explore-tabs-container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-tabs"
          items={[
            {
              key: 'posts',
              label: <span className="px-2">Posts</span>,
              children: (
                <div className="animate-fade-in space-y-4">
                  {postsLoading ? (
                    <div className="flex justify-center py-12"><Spin size="large" /></div>
                  ) : (postsData?.data || []).length === 0 ? (
                    <div className="card p-8 sm:p-12 text-center">
                      <Empty description={<span style={{ color: 'var(--text-secondary)' }}>No posts found matching your search</span>} />
                    </div>
                  ) : (
                    <>
                      {(postsData?.data || []).map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))}
                      {postsData && page < postsData.pages && (
                        <div className="flex justify-center py-6">
                          <Button 
                            onClick={() => setPage((p) => p + 1)}
                            className="px-8 rounded-full h-10"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          >
                            Load more
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'users',
              label: <span className="px-2">People</span>,
              children: (
                <div className="space-y-3 animate-fade-in">
                  {usersLoading ? (
                    <div className="flex justify-center py-12"><Spin size="large" /></div>
                  ) : !q || q.length < 2 ? (
                    <div className="card p-8 sm:p-12 text-center">
                      <Empty description={<span style={{ color: 'var(--text-secondary)' }}>Try searching for a name or username</span>} />
                    </div>
                  ) : (usersData?.data || []).length === 0 ? (
                    <div className="card p-8 sm:p-12 text-center">
                      <Empty description={<span style={{ color: 'var(--text-secondary)' }}>No users found for "{q}"</span>} />
                    </div>
                  ) : (
                    (usersData?.data || []).map((user) => <UserCard key={user._id} user={user} />)
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ExplorePage;
