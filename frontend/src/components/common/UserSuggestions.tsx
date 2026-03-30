// src/components/common/UserSuggestions.tsx
import React from 'react';
import { Spin } from 'antd';
import { useSuggestions } from '@/hooks/useQueries';
import UserCard from './UserCard';

const UserSuggestions: React.FC = () => {
  const { data: suggestions, isLoading } = useSuggestions();

  if (isLoading) return (
    <div className="card p-6 flex justify-center">
      <Spin size="small" />
    </div>
  );

  if (!suggestions?.length) return null;

  return (
    <div className="card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--text-muted)' }}>
        Who to Follow
      </h3>
      <div className="space-y-3">
        {suggestions.map((user) => (
          <UserCard key={user._id} user={user} compact />
        ))}
      </div>
    </div>
  );
};

export default UserSuggestions;
