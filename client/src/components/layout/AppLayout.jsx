import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import SettingsModal from './SettingsModal';

export default function AppLayout({
  activePage,
  onNavigate,
  activeCategory,
  onSelectCategory,
  user,
  profile,
  actionPlan,
  skillAssessmentResult,
  onProfileUpdated,
  onLogout,
  children
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-collapse sidebar on smaller screens or restore on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200 && window.innerWidth >= 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1200) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveCategoryPreference = (newCategory) => {
    if (onSelectCategory) {
      onSelectCategory(newCategory);
    }
  };

  return (
    <div className="saas-layout">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="saas-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        onLogout={onLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area Wrapper */}
      <div className={`saas-main-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header */}
        <TopHeader
          activePage={activePage}
          onNavigate={onNavigate}
          activeCategory={activeCategory}
          onSelectCategory={onSelectCategory}
          user={user}
          profile={profile}
          actionPlan={actionPlan}
          skillAssessmentResult={skillAssessmentResult}
          onLogout={onLogout}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Dynamic Page Content Slot */}
        <main className="saas-content-area" id="main-content">
          {children}
        </main>
      </div>

      {/* User Preferences & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        profile={profile}
        onSaveCategoryPreference={handleSaveCategoryPreference}
      />
    </div>
  );
}
