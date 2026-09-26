import React from 'react';
import { Compass, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar({ 
  activePage, 
  onNavigate, 
  activeCategory, 
  onSelectCategory,
  user,
  onLogout 
}) {
  const isLoggedIn = !!user;

  const navLinks = isLoggedIn ? [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'careerDiscovery', label: 'Career Discovery' },
    { id: 'profile', label: 'Profile' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'actionPlan', label: 'Action Plan' },
    { id: 'assistant', label: 'AI Assistant' },
    { id: 'interview', label: 'Interview Prep' },
    { id: 'careers', label: 'Careers' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'projects', label: 'Projects' },
  ] : [
    { id: 'home', label: 'Home' },
    { id: 'careers', label: 'Careers' },
    { id: 'login', label: 'Log In' },
    { id: 'signup', label: 'Sign Up' },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 16,
      zIndex: 100,
      marginBottom: 28
    }}>
      <div className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand Header */}
        <div 
          onClick={() => onNavigate('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 38,
            height: 38,
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
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0, lineHeight: 1.2 }}>
              Smart Career Guidance
            </h1>
            <span style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 600 }}>
              AI-Powered Platform
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {navLinks.map((link) => {
            const isSelected = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  borderRadius: 8,
                  border: 'none',
                  background: isSelected ? '#172554' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar: Category Filter & Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Category Filter Pills (Preserved Phase 1) */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(241, 245, 249, 0.9)', padding: 3, borderRadius: 8 }}>
            {['all', 'IT', 'Non-IT'].map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className="btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderRadius: 6,
                  border: 'none',
                  background: activeCategory === cat ? '#FFFFFF' : 'transparent',
                  color: activeCategory === cat ? '#172554' : '#64748B',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  boxShadow: activeCategory === cat ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* User Auth Badge & Logout */}
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(79, 70, 229, 0.1)',
                color: '#4F46E5',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                <UserIcon size={14} />
                <span>{user.full_name?.split(' ')[0] || 'Account'}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="btn btn-outline"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  borderRadius: 8,
                  borderColor: '#CBD5E1',
                  color: '#64748B'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="btn"
              style={{
                background: '#172554',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
