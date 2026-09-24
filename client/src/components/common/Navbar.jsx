import React from 'react';
import { Compass } from 'lucide-react';

export default function Navbar({ activeCategory, onSelectCategory }) {
  return (
    <header style={{
      position: 'sticky',
      top: 16,
      zIndex: 100,
      marginBottom: 32
    }}>
      <div className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Compass size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0, lineHeight: 1.2 }}>
              Smart Career Guidance
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>
              IT & Non-IT AI-Powered Platform
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(241, 245, 249, 0.8)', padding: 4, borderRadius: 10 }}>
          {['all', 'IT', 'Non-IT'].map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: 8,
                border: 'none',
                background: activeCategory === cat ? '#FFFFFF' : 'transparent',
                color: activeCategory === cat ? '#172554' : '#64748B',
                fontWeight: activeCategory === cat ? 700 : 500,
                boxShadow: activeCategory === cat ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer'
              }}
            >
              {cat === 'all' ? 'All Pathways' : cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
