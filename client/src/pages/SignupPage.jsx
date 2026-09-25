import React, { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import { signupUser } from '../services/api';
import { UserPlus, User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function SignupPage({ onSignupSuccess, onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your passwords.');
      return;
    }

    try {
      setLoading(true);
      const res = await signupUser({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword
      });
      // Automatic login after successful registration
      onSignupSuccess(res.access_token, res.user);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your information.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '30px auto' }}>
      <GlassCard style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #172554 0%, #7C3AED 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: 12
          }}>
            <UserPlus size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#172554', margin: 0 }}>
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 6 }}>
            Join Smart Career Guidance to unlock personalized AI recommendations
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172554', marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Johnson"
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
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
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
              Password (Min 6 characters)
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

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172554', marginBottom: 6 }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Sign Up & Continue'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{
          borderTop: '1px solid #E2E8F0',
          marginTop: 24,
          paddingTop: 18,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}
            >
              Log In
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
