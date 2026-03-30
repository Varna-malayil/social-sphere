// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '@/api';
import { useAuthStore } from '@/store/authStore';

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
    {children}
    {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
  </div>
);

const RegisterPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers, underscores only';
    if (!form.email) e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!/\d/.test(form.password)) e.password = 'Password must contain a number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        username: form.username, email: form.email, password: form.password,
      });
      setAuth(data.data, data.token!);
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">✦ SocialSphere</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create your account and start connecting</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username" error={errors.username}>
              <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="cooluser123" value={form.username} size="large"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                status={errors.username ? 'error' : ''} />
            </Field>

            <Field label="Email" error={errors.email}>
              <Input prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
                type="email" placeholder="you@example.com" value={form.email} size="large"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                status={errors.email ? 'error' : ''} />
            </Field>

            <Field label="Password" error={errors.password}>
              <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="••••••••" value={form.password} size="large"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                status={errors.password ? 'error' : ''} />
            </Field>

            <Field label="Confirm Password" error={errors.confirm}>
              <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="••••••••" value={form.confirm} size="large"
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                status={errors.confirm ? 'error' : ''} />
            </Field>

            <Button type="primary" htmlType="submit" loading={loading} block size="large"
              style={{ borderRadius: 12, height: 48, fontWeight: 600, marginTop: 8 }}>
              Create Account
            </Button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
