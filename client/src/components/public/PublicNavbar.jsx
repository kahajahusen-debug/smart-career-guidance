import React, { useState } from 'react';
import { GraduationCap, ArrowRight, Menu, X } from 'lucide-react';

export default function PublicNavbar({ activeSection = 'home', onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (sectionId === 'home') {
      if (onNavigate) onNavigate('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on a page other than home, first navigate to home then scroll
    if (window.location.pathname !== '/' && onNavigate) {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.03)'
    }}>
      <div style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '0 24px',
        height: 74,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Brand Logo & App Name */}
        <div
          onClick={() => handleLinkClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            userSelect: 'none'
          }}
          title="Smart Career Guidance System"
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#172554',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(23, 37, 84, 0.15)'
          }}>
            <GraduationCap size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '1.02rem',
              fontWeight: 800,
              color: '#172554',
              lineHeight: 1.15,
              letterSpacing: '-0.01em'
            }}>
              Smart Career
            </span>
            <span style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#172554',
              lineHeight: 1.15,
              letterSpacing: '-0.01em'
            }}>
              Guidance System
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 36
        }} className="desktop-nav">
          <button
            onClick={() => handleLinkClick('home')}
            className={`nav-link-item ${activeSection === 'home' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: activeSection === 'home' ? 700 : 500,
              color: activeSection === 'home' ? '#172554' : '#64748B',
              cursor: 'pointer',
              padding: '6px 2px'
            }}
          >
            Home
          </button>

          <button
            onClick={() => handleLinkClick('about')}
            className={`nav-link-item ${activeSection === 'about' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: activeSection === 'about' ? 700 : 500,
              color: activeSection === 'about' ? '#172554' : '#64748B',
              cursor: 'pointer',
              padding: '6px 2px'
            }}
          >
            About
          </button>

          <button
            onClick={() => handleLinkClick('features')}
            className={`nav-link-item ${activeSection === 'features' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: activeSection === 'features' ? 700 : 500,
              color: activeSection === 'features' ? '#172554' : '#64748B',
              cursor: 'pointer',
              padding: '6px 2px'
            }}
          >
            Features
          </button>
        </nav>

        {/* Right: Action Buttons (Login & Get Started) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }} className="desktop-actions">
          <button
            onClick={() => onNavigate && onNavigate('login')}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: 9999,
              padding: '8px 22px',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#172554',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.background = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            Login
          </button>

          <button
            onClick={() => onNavigate && onNavigate('signup')}
            style={{
              background: '#4F46E5',
              border: 'none',
              borderRadius: 9999,
              padding: '9px 24px',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4338CA';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4F46E5';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            padding: 8,
            color: '#172554',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '20px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)'
        }}>
          <button
            onClick={() => handleLinkClick('home')}
            style={{
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: '1rem',
              fontWeight: activeSection === 'home' ? 700 : 500,
              color: activeSection === 'home' ? '#4F46E5' : '#0F172A',
              padding: '8px 0'
            }}
          >
            Home
          </button>

          <button
            onClick={() => handleLinkClick('about')}
            style={{
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#0F172A',
              padding: '8px 0'
            }}
          >
            About
          </button>

          <button
            onClick={() => handleLinkClick('features')}
            style={{
              textAlign: 'left',
              background: 'none',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#0F172A',
              padding: '8px 0'
            }}
          >
            Features
          </button>

          <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />

          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigate) onNavigate('login');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 9999,
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                fontWeight: 600,
                color: '#172554',
                fontSize: '0.95rem'
              }}
            >
              Login
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigate) onNavigate('signup');
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 9999,
                background: '#4F46E5',
                border: 'none',
                fontWeight: 600,
                color: '#FFFFFF',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-actions {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
