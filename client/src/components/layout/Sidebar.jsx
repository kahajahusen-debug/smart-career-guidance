import React from 'react';
import {
  LayoutDashboard,
  Compass,
  User,
  CheckSquare,
  Award,
  Target,
  Bot,
  Briefcase,
  Search,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({
  activePage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  user,
  onLogout,
  onOpenSettings
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'careerDiscovery', label: 'Career Discovery', icon: Compass },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'assessment', label: 'Skill Assessment', icon: CheckSquare },
    { id: 'recommendations', label: 'Career Recommendations', icon: Award },
    { id: 'actionPlan', label: 'Career Action Plan', icon: Target },
    { id: 'assistant', label: 'AI Career Assistant', icon: Bot },
    { id: 'interview', label: 'Interview Preparation', icon: Briefcase },
    { id: 'jobs', label: 'Careers & Jobs', icon: Search },
    { id: 'projects', label: 'Portfolio Projects', icon: FolderGit2 },
  ];

  const handleItemClick = (pageId) => {
    onNavigate(pageId);
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`saas-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      aria-label="Main Navigation"
      style={{
        background: '#172554',
        color: '#FFFFFF'
      }}
    >
      {/* Brand Header */}
      <div style={{
        height: 'var(--header-height)',
        padding: isCollapsed ? '0 12px' : '0 16px 0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: 8
      }}>
        <div
          onClick={() => handleItemClick('dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick('dashboard'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            overflow: 'hidden',
            textDecoration: 'none'
          }}
          title="Smart Career Guidance"
        >
          {/* Logo Accent */}
          <div style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: 10,
            background: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)'
          }}>
            <Compass size={20} />
          </div>

          {!isCollapsed && (
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '0.94rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Smart Career
              </span>
              <span style={{
                fontSize: '0.68rem',
                color: '#93C5FD',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                AI-Powered Guidance
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobileOpen ? (
          <button
            onClick={onCloseMobile}
            className="btn btn-ghost"
            style={{ padding: 6, display: 'flex', borderRadius: 8, color: '#CBD5E1' }}
            aria-label="Close navigation drawer"
          >
            <X size={18} />
          </button>
        ) : (
          /* Desktop Collapse Toggle Button */
          !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="btn btn-ghost"
              style={{
                padding: 6,
                color: '#94A3B8',
                borderRadius: 8
              }}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )
        )}
      </div>

      {/* Expand button when collapsed on desktop */}
      {isCollapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <button
            onClick={onToggleCollapse}
            className="btn btn-ghost"
            style={{ padding: 6, color: '#94A3B8', borderRadius: 8 }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Navigation Items List */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: isCollapsed ? '8px 8px' : '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="btn"
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: 12,
                padding: isCollapsed ? '10px 0' : '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? '#4F46E5' : 'transparent',
                color: isActive ? '#FFFFFF' : '#CBD5E1',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#233568';
                  e.currentTarget.style.color = '#FFFFFF';
                  const iconEl = e.currentTarget.querySelector('.sidebar-nav-icon');
                  if (iconEl) iconEl.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#CBD5E1';
                  const iconEl = e.currentTarget.querySelector('.sidebar-nav-icon');
                  if (iconEl) iconEl.style.color = '#CBD5E1';
                }
              }}
            >
              <div
                className="sidebar-nav-icon"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  transition: 'color 0.15s ease'
                }}
              >
                <Icon size={18} />
              </div>

              {!isCollapsed && (
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Area: Settings & User Account / Logout (No harsh divider line) */}
      <div style={{
        padding: isCollapsed ? '12px 8px' : '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="btn btn-ghost"
          title={isCollapsed ? 'Settings' : undefined}
          aria-label="Settings"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 12,
            padding: isCollapsed ? '8px 0' : '8px 12px',
            fontSize: '0.84rem',
            color: '#CBD5E1',
            fontWeight: 500,
            borderRadius: 8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#233568';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#CBD5E1';
          }}
        >
          <Settings size={17} />
          {!isCollapsed && <span>Settings</span>}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn btn-ghost"
          title={isCollapsed ? 'Logout' : undefined}
          aria-label="Logout"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 12,
            padding: isCollapsed ? '8px 0' : '8px 12px',
            fontSize: '0.84rem',
            color: '#CBD5E1',
            fontWeight: 500,
            borderRadius: 8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#233568';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#CBD5E1';
          }}
        >
          <LogOut size={17} />
          {!isCollapsed && <span>Logout</span>}
        </button>

        {/* User Account Card */}
        <div
          onClick={() => handleItemClick('profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick('profile'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: 10,
            padding: isCollapsed ? '6px 0' : '8px 10px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
          title={user?.full_name || 'My Profile'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: '50%',
              background: '#4F46E5',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {getInitials(user?.full_name)}
            </div>

            {!isCollapsed && (
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.full_name || 'Student Account'}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  color: '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.email || 'Logged in'}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && <ChevronRight size={16} color="#94A3B8" />}
        </div>
      </div>
    </aside>
  );
}
