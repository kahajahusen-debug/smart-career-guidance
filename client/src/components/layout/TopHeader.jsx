import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Search
} from 'lucide-react';

export default function TopHeader({
  activePage,
  onNavigate,
  activeCategory,
  onSelectCategory,
  user,
  profile,
  actionPlan,
  skillAssessmentResult,
  onLogout,
  onToggleMobileSidebar,
  onOpenSettings
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title and breadcrumb
  const getPageMeta = (page) => {
    switch (page) {
      case 'dashboard':
        return { title: 'Dashboard', section: 'Overview' };
      case 'careerDiscovery':
        return { title: 'Career Discovery', section: 'Self Assessment' };
      case 'profile':
        return { title: 'My Profile', section: 'Account & Qualifications' };
      case 'assessment':
        return { title: 'Skill Assessment', section: 'Technical Evaluation' };
      case 'recommendations':
        return { title: 'Career Recommendations', section: 'AI Matching' };
      case 'actionPlan':
        return { title: 'Career Action Plan', section: 'Roadmap & Gaps' };
      case 'assistant':
        return { title: 'AI Career Assistant', section: 'Mentorship' };
      case 'interview':
        return { title: 'Interview Preparation', section: 'Mock Practice' };
      case 'jobs':
        return { title: 'Careers & Jobs', section: 'Opportunities' };
      case 'careerDetail':
        return { title: 'Career Profile', section: 'Recommendations' };
      case 'projects':
        return { title: 'Portfolio Projects', section: 'Proof of Work' };
      case 'projectDetail':
        return { title: 'Project Details', section: 'Portfolio Projects' };
      default:
        return { title: 'Smart Career Guidance', section: 'Portal' };
    }
  };

  const pageMeta = getPageMeta(activePage);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Real connected notifications based on application data
  const realNotifications = [];
  const isProfileComplete = profile?.current_skills && profile.current_skills.length >= 2;
  const isAssessmentComplete = skillAssessmentResult && skillAssessmentResult.overall_accuracy !== undefined;

  if (!isProfileComplete) {
    realNotifications.push({
      id: 'notif-prof',
      title: 'Profile Incomplete',
      desc: 'Add skills and education to unlock personalized matching.',
      page: 'profile',
      icon: AlertTriangle,
      color: '#D97706'
    });
  }

  if (!isAssessmentComplete) {
    realNotifications.push({
      id: 'notif-ass',
      title: 'Skill Assessment Pending',
      desc: 'Complete technical assessment to calculate accuracy benchmarks.',
      page: 'assessment',
      icon: Sparkles,
      color: '#4F46E5'
    });
  }

  if (actionPlan?.target_career_title) {
    realNotifications.push({
      id: 'notif-plan',
      title: 'Target Career Active',
      desc: `Roadmap ready for ${actionPlan.target_career_title}.`,
      page: 'actionPlan',
      icon: CheckCircle2,
      color: '#059669'
    });
  }

  const notificationCount = realNotifications.length;

  // Show IT/Non-IT filter ONLY on relevant exploration pages
  const showCategoryFilter = ['recommendations', 'jobs', 'projects', 'careerDetail'].includes(activePage);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : 'Farha';

  return (
    <header className="saas-top-header" style={{
      background: '#FFFFFF',
      borderBottom: 'none',
      boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.03)',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16
    }}>
      {/* Left side: Hamburger (Mobile) + Breadcrumb & Title or Dashboard Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onToggleMobileSidebar}
          className="mobile-hamburger-btn btn btn-ghost"
          style={{
            padding: 8,
            borderRadius: 8,
            color: '#334155',
            display: 'none'
          }}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        {activePage === 'dashboard' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sun size={26} color="#F59E0B" strokeWidth={2.3} style={{ flexShrink: 0 }} />
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.2
              }}>
                {getGreeting()}, {firstName}!
              </h1>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Your career journey, at a glance.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#64748B' }}>
              <span>Portal</span>
              <span>/</span>
              <span style={{ fontWeight: 600, color: '#475569' }}>{pageMeta.section}</span>
            </div>
            <h1 style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.2
            }}>
              {pageMeta.title}
            </h1>
          </div>
        )}
      </div>

      {/* Right side: Search Input + Contextual Filter + Notifications + Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search Bar matching screenshot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#F1F5F9',
          borderRadius: 999,
          padding: '6px 16px',
          gap: 8,
          minWidth: 200,
          maxWidth: 260
        }}>
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search anything..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.8rem',
              color: '#0F172A',
              width: '100%'
            }}
          />
        </div>

        {/* Contextual IT / Non-IT Filter (Only on relevant pages) */}
        {showCategoryFilter && (
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: 3,
            borderRadius: 8
          }}>
            {['all', 'IT', 'Non-IT'].map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: 6,
                    border: 'none',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#0F172A' : '#64748B',
                    fontWeight: isSelected ? 700 : 500,
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'all' ? 'All Roles' : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Notifications Icon with Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="btn btn-ghost"
            style={{
              padding: 8,
              borderRadius: 8,
              color: notificationsOpen ? '#4F46E5' : '#64748B',
              position: 'relative'
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#EF4444'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 320,
              background: '#FFFFFF',
              borderRadius: 14,
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Notifications</span>
                <span style={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 600 }}>Active Updates</span>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {realNotifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>
                    All milestones up to date!
                  </div>
                ) : (
                  realNotifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => { setNotificationsOpen(false); onNavigate(n.page); }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #F8FAFC',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <Icon size={14} color={n.color} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{n.title}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                          {n.desc}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="btn btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px 4px 4px',
              borderRadius: 24,
              background: profileDropdownOpen ? '#F1F5F9' : 'transparent'
            }}
            aria-label="User Profile Menu"
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#4F46E5',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {getInitials(user?.full_name)}
            </div>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#0F172A',
              maxWidth: 110,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.full_name?.split(' ')[0] || 'Student'}
            </span>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 220,
              background: '#FFFFFF',
              borderRadius: 14,
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                  {user?.full_name || 'Student Account'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </div>
              </div>

              <div style={{ padding: '6px' }}>
                <button
                  onClick={() => { setProfileDropdownOpen(false); onNavigate('profile'); }}
                  className="btn btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    color: '#334155',
                    borderRadius: 6
                  }}
                >
                  <UserIcon size={16} /> My Profile
                </button>

                <button
                  onClick={() => { setProfileDropdownOpen(false); onOpenSettings(); }}
                  className="btn btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    color: '#334155',
                    borderRadius: 6
                  }}
                >
                  <Settings size={16} /> Settings
                </button>

                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                <button
                  onClick={() => { setProfileDropdownOpen(false); onLogout(); }}
                  className="btn btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    color: '#DC2626',
                    borderRadius: 6
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-hamburger-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
