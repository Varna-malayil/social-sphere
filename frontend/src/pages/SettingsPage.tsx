// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { Input, Button, Switch, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/api';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('Passwords do not match'); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters'); return;
    }
    setPwError('');
    setPwLoading(true);
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      message.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-lg">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Account Info */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <UserOutlined /> Account
        </h2>
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span>Username</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>@{user?.username}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span>Email</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Account Role</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: user?.role === 'admin' ? '#fbbf2420' : 'var(--accent-dim)',
                       color: user?.role === 'admin' ? '#fbbf24' : 'var(--accent)' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <LockOutlined /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { label: 'Current Password', key: 'currentPassword', placeholder: '••••••••' },
            { label: 'New Password',     key: 'newPassword',     placeholder: '••••••••' },
            { label: 'Confirm New',      key: 'confirm',         placeholder: '••••••••' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <Input.Password
                placeholder={placeholder}
                value={(pwForm as any)[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
              />
            </div>
          ))}
          {pwError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{pwError}</p>}
          <Button type="primary" htmlType="submit" loading={pwLoading} style={{ borderRadius: 10 }}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Privacy */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Privacy</h2>
        <div className="space-y-4">
          {[
            { label: 'Private Account',    desc: 'Only approved followers can see your posts' },
            { label: 'Show Online Status', desc: 'Let others see when you\'re active'           },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <Switch defaultChecked={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
