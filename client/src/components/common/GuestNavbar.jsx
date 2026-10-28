import React from 'react';
import { Compass, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function GuestNavbar({ activePage, onNavigate }) {
  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand */}
      <div
        onClick={() => onNavigate('home')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <Compass size={20} />
        </div>
        <div>
          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, display: 'block' }}>
            Smart Career Guidance
          </span>
          <span style={{ fontSize: '0.68rem', color: '#4F46E5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI-Powered Platform
          </span>
        </div>
      </div>

      {/* Navigation links & Auth Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => onNavigate('home')}
          className="btn btn-ghost"
          style={{
            fontSize: '0.84rem',
            color: activePage === 'home' ? '#4F46E5' : '#475569',
            fontWeight: activePage === 'home' ? 700 : 500,
            padding: '8px 12px'
          }}
        >
          Home
        </button>

        <button
          onClick={() => onNavigate('careers')}
          className="btn btn-ghost"
          style={{
            fontSize: '0.84rem',
            color: activePage === 'careers' ? '#4F46E5' : '#475569',
            fontWeight: activePage === 'careers' ? 700 : 500,
            padding: '8px 12px'
          }}
        >
          Explore Careers
        </button>

        <div style={{ width: 1, height: 20, background: '#E2E8F0', margin: '0 4px' }} />

        <button
          onClick={() => onNavigate('login')}
          className="btn btn-outline"
          style={{ padding: '7px 14px', fontSize: '0.84rem', fontWeight: 600 }}
        >
          <LogIn size={14} />
          <span>Log In</span>
        </button>

        <button
          onClick={() => onNavigate('signup')}
          className="btn btn-primary"
          style={{ padding: '7px 16px', fontSize: '0.84rem', fontWeight: 700 }}
        >
          <UserPlus size={14} />
          <span>Sign Up</span>
        </button>
      </div>
    </header>
  );
}
