// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '@/api';
import { useAuthStore } from '@/store/authStore';

const LoginPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.data, data.token!);
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0b0b10 100%)' }}>
        <div className="max-w-sm">
          <h1 className="text-5xl font-bold mb-4 text-gradient">✦ SocialSphere</h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your Voice. Your World. Your People.
          </p>
          {/* <div className="mt-10 space-y-4">
            {['Real-time conversations', 'Beautiful media sharing', 'Discover amazing people'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-md flex flex-col justify-center px-8 lg:px-16">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <Input
                prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                size="large"
                status={errors.email ? 'error' : ''}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                size="large"
                status={errors.password ? 'error' : ''}
              />
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ borderRadius: 12, height: 48, fontWeight: 600, marginTop: 8 }}>
              Sign In
            </Button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up</Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-xl text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Demo: </span>
            admin@demo.com / password123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
