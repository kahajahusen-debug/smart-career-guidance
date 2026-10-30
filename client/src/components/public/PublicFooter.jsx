import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function PublicFooter({ onNavigate }) {
  const handleHomeClick = () => {
    if (onNavigate) onNavigate('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{
      background: '#172554',
      color: '#FFFFFF',
      padding: '36px 24px',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{
        maxWidth: 1240,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <div
          onClick={handleHomeClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <GraduationCap size={20} />
          </div>
          <span style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.01em'
          }}>
            Smart Career Guidance System
          </span>
        </div>

        {/* Copyright */}
        <div style={{
          fontSize: '0.88rem',
          color: '#94A3B8'
        }}>
          &copy; 2026 Smart Career Guidance System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
