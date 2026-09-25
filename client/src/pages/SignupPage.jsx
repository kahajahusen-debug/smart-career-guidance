import React, { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import { signupUser } from '../services/api';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function SignupPage({ onSignupSuccess, onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    // Check empty fields
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    // Check password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your passwords.');
      return;
    }

    try {
      setLoading(true);

      const res = await signupUser({
        full_name: fullName,
        email: email,
        password: password,
        confirm_password: confirmPassword
      });

      /*
       * IMPORTANT:
       * We are NOT automatically logging the user in here.
       *
       * After successful signup:
       * Signup Page → Login Page
       *
       * The user must enter their email and password
       * on the Login Page to access the Dashboard.
       */

      setSuccess(
        'Account created successfully! Redirecting you to the login page...'
      );

      // Wait for a short time so the success message can be seen
      setTimeout(() => {
        onNavigate('login');
      }, 1200);

    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Registration failed. Please check your information.';

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '30px auto' }}>
      <GlassCard style={{ padding: '36px' }}>

        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 28
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background:
                'linear-gradient(135deg, #172554 0%, #7C3AED 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              marginBottom: 12
            }}
          >
            <UserPlus size={26} />
          </div>

          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#172554',
              margin: 0
            }}
          >
            Create Your Account
          </h2>

          <p
            style={{
              fontSize: '0.88rem',
              color: '#64748B',
              marginTop: 6
            }}
          >
            Join Smart Career Guidance to unlock personalized AI
            recommendations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
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
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: '0.85rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >

          {/* Full Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#172554',
                marginBottom: 6
              }}
            >
              Full Name
            </label>

            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="#94A3B8"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 12
                }}
              />

              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Johnson"
                disabled={loading}
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

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#172554',
                marginBottom: 6
              }}
            >
              Email Address
            </label>

            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#94A3B8"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 12
                }}
              />

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                disabled={loading}
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

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#172554',
                marginBottom: 6
              }}
            >
              Password (Min 6 characters)
            </label>

            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#94A3B8"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 12
                }}
              />

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
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

          {/* Confirm Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#172554',
                marginBottom: 6
              }}
            >
              Confirm Password
            </label>

            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#94A3B8"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 12
                }}
              />

              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="••••••••"
                disabled={loading}
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

          {/* Signup Button */}
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
              marginTop: 6,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up & Continue'}

            {!loading && <ArrowRight size={18} />}
          </button>

        </form>

        {/* Login Link */}
        <div
          style={{
            borderTop: '1px solid #E2E8F0',
            marginTop: 24,
            paddingTop: 18,
            textAlign: 'center'
          }}
        >
          <p
            style={{
              fontSize: '0.88rem',
              color: '#64748B',
              margin: 0
            }}
          >
            Already have an account?{' '}

            <button
              onClick={() => onNavigate('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Log In
            </button>
          </p>
        </div>

      </GlassCard>
    </div>
  );
}