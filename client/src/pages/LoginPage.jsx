import React, { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import { loginUser } from '../services/api';
import { LogIn, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({ email, password });
      onLoginSuccess(res.access_token, res.user);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('candidate@example.com');
    setPassword('candidate123');
    setError(null);
    try {
      setLoading(true);
      // Attempt login or create demo user if not exists
      try {
        const res = await loginUser({ email: 'candidate@example.com', password: 'candidate123' });
        onLoginSuccess(res.access_token, res.user);
      } catch (logErr) {
        // Fallback demo user login attempt
        setError('Demo user not initialized. Please click Sign Up to register a new account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <GlassCard style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: 12
          }}>
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#172554', margin: 0 }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 6 }}>
            Sign in to access your personalized career assessment & recommendations
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: '0.85rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172554', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172554', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn"
            style={{
              background: '#172554',
              color: '#FFFFFF',
              padding: '12px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 6
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{
          borderTop: '1px solid #E2E8F0',
          marginTop: 24,
          paddingTop: 20,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign Up Now
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
