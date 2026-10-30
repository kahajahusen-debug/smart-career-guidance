import React, { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import GuestNavbar from './components/common/GuestNavbar';
import PublicFooter from './components/public/PublicFooter';
import PublicHomePage from './pages/PublicHomePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CareerDiscoveryPage from './pages/CareerDiscoveryPage';
import AssessmentPage from './pages/AssessmentPage';
import CareerResultsPage from './pages/CareerResultsPage';
import CareerDetailPage from './pages/CareerDetailPage';
import JobsPage from './pages/JobsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CareerAssistantPage from './pages/CareerAssistantPage';
import InterviewPreparationPage from './pages/InterviewPreparationPage';
import {
  fetchCurrentUser,
  getProfile,
  getDiscoveryResult,
  getAssessmentResult,
  getSkillAssessmentResult,
  getActionPlan
} from './services/api';

const getPageFromPath = (path) => {
  if (path === '/login') return 'login';
  if (path === '/signup') return 'signup';
  if (path === '/dashboard') return 'dashboard';
  if (path === '/discovery') return 'careerDiscovery';
  if (path === '/assessment') return 'assessment';
  if (path === '/career-results' || path === '/recommendations' || path === '/action-plan') return 'careerResults';
  return 'home';
};

const getPathFromPage = (page) => {
  switch (page) {
    case 'login': return '/login';
    case 'signup': return '/signup';
    case 'dashboard': return '/dashboard';
    case 'careerDiscovery': return '/discovery';
    case 'assessment': return '/assessment';
    case 'careerResults':
    case 'recommendations':
    case 'actionPlan':
      return '/career-results';
    case 'home': return '/';
    default: return '/';
  }
};

export default function App() {
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname));
  const [activeCategory, setActiveCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [skillAssessmentResult, setSkillAssessmentResult] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [selectedCareerId, setSelectedCareerId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [assistantPrompt, setAssistantPrompt] = useState(null);
  const [interviewPreselectedCareer, setInterviewPreselectedCareer] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  // Check authentication status on startup & listen to popstate
  useEffect(() => {
    checkInitialAuth();

    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setActivePage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const checkInitialAuth = async () => {
    const initialPath = window.location.pathname;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      if (initialPath === '/dashboard') {
        setAuthNotice('Please log in to access your personalized dashboard and career guidance features.');
        setActivePage('login');
        window.history.replaceState({ page: 'login' }, '', '/login');
      }
      setAuthChecking(false);
      return;
    }

    try {
      const userData = await fetchCurrentUser();
      setUser(userData);

      // Load user profile, discovery, skill assessment results, and action plan in background
      const [profData, discData, skillData, planData] = await Promise.all([
        getProfile().catch(() => null),
        getDiscoveryResult().catch(() => null),
        getSkillAssessmentResult().catch(() => null),
        getActionPlan().catch(() => null)
      ]);

      if (profData) setProfile(profData);
      if (skillData && skillData.success !== false) setSkillAssessmentResult(skillData);
      if (planData && !planData.detail) setActionPlan(planData);

      const hasCompletedDiscovery = Boolean(discData?.result || discData?.has_completed);
      const hasCompletedSkill = Boolean(
        skillData &&
        skillData.success !== false &&
        (skillData.completed || skillData.overall_accuracy !== undefined || (skillData.results && Object.keys(skillData.results).length > 0))
      );

      // Workflow routing rule for returning users / initial load:
      setActivePage((prev) => {
        if (prev === 'home' || prev === 'login' || prev === 'signup' || (prev === 'dashboard' && initialPath === '/dashboard')) {
          window.history.replaceState({ page: 'dashboard' }, '', '/dashboard');
          return 'dashboard';
        }
        return prev;
      });
    } catch (err) {
      console.log('Session token expired or invalid:', err);
      localStorage.removeItem('auth_token');
      setUser(null);
      if (initialPath === '/dashboard') {
        setAuthNotice('Your session expired. Please log in again.');
        setActivePage('login');
        window.history.replaceState({ page: 'login' }, '', '/login');
      }
    } finally {
      setAuthChecking(false);
    }
  };

  const handleNavigate = (targetPage, options = {}) => {
    setAuthNotice(null);
    let effectiveTarget = targetPage;
    if (effectiveTarget === 'recommendations' || effectiveTarget === 'actionPlan') {
      effectiveTarget = 'careerResults';
    }

    const protectedPages = [
      'dashboard',
      'profile',
      'careerDiscovery',
      'assessment',
      'careerResults',
      'jobs',
      'projects',
      'projectDetail',
      'careerDetail',
      'assistant',
      'interview'
    ];

    // Auth Guard
    if (protectedPages.includes(effectiveTarget) && !user) {
      setAuthNotice('Please log in to access your personalized dashboard and career guidance features.');
      setActivePage('login');
      window.history.pushState({ page: 'login' }, '', '/login');
      return;
    }

    if (options.prompt) setAssistantPrompt(options.prompt);
    if (options.career) setInterviewPreselectedCareer(options.career);

    if (effectiveTarget === 'profile') {
      setActivePage('dashboard');
      window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
      return;
    }

    setActivePage(effectiveTarget);
    const targetPath = getPathFromPage(effectiveTarget);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: effectiveTarget }, '', targetPath);
    }
  };

  const handleLoginSuccess = async (token, userData) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setAuthNotice(null);

    // Fetch user profile, discovery result, skill assessment, and action plan
    try {
      const [profData, discData, skillData, planData] = await Promise.all([
        getProfile().catch(() => null),
        getDiscoveryResult().catch(() => null),
        getSkillAssessmentResult().catch(() => null),
        getActionPlan().catch(() => null)
      ]);
      if (profData) setProfile(profData);
      if (skillData && skillData.success !== false) setSkillAssessmentResult(skillData);
      if (planData && !planData.detail) setActionPlan(planData);
    } catch (e) {
      console.log('Error loading post-login data:', e);
    } finally {
      // Requirement B: Every successful login must open Dashboard first, regardless of assessment status
      setActivePage('dashboard');
      window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
    }
  };

  const handleSignupSuccess = () => {
    // Requirement A: After successful signup, display success message and redirect to Login
    // Do not automatically log the user in; do not redirect to Discovery or Dashboard
    setAuthNotice('Registration successful! Please log in with your credentials.');
    setActivePage('login');
    window.history.pushState({ page: 'login' }, '', '/login');
  };

  const handleDiscoveryCompleted = () => {
    // Requirement D: Automatically navigate to Skill Assessment after completing discovery
    setActivePage('assessment');
    window.history.pushState({ page: 'assessment' }, '', '/assessment');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
    setAssessmentResult(null);
    setSkillAssessmentResult(null);
    setActionPlan(null);
    setAuthNotice(null);
    setActivePage('login');
    window.history.pushState({ page: 'login' }, '', '/login');
  };

  const handleSelectCareerDetail = (careerId) => {
    setSelectedCareerId(careerId);
    setActivePage('careerDetail');
  };

  const handleSelectProjectDetail = (projectId) => {
    setSelectedProjectId(projectId);
    setActivePage('projectDetail');
  };

  const handleAssessmentSubmitted = async (result) => {
    if (result.career_recommendations) {
      setAssessmentResult(result);
    }
    if (result.overall_accuracy !== undefined) {
      setSkillAssessmentResult(result);
    }

    // Background refetch to ensure both states stay synced
    try {
      const [assData, skillData] = await Promise.all([
        getAssessmentResult().catch(() => null),
        getSkillAssessmentResult().catch(() => null)
      ]);
      if (assData) setAssessmentResult(assData);
      if (skillData) setSkillAssessmentResult(skillData);
    } catch {
      // background sync
    }
  };

  const handleTargetCareerUpdated = async (careerId) => {
    try {
      const [profData, skillData, assData, planData] = await Promise.all([
        getProfile().catch(() => null),
        getSkillAssessmentResult().catch(() => null),
        getAssessmentResult().catch(() => null),
        getActionPlan().catch(() => null)
      ]);
      if (profData) setProfile(profData);
      if (skillData && skillData.success !== false) setSkillAssessmentResult(skillData);
      if (assData) setAssessmentResult(assData);
      if (planData && !planData.detail) setActionPlan(planData);
    } catch (e) {
      console.log('Target career updated sync error:', e);
    }
  };

  if (authChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#F8FAFC'
      }}>
        <div style={{
          background: '#FFFFFF',
          padding: '24px 36px',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.06)',
          color: '#0F172A',
          fontWeight: 700,
          fontSize: '0.98rem'
        }}>
          Initializing Smart Career Guidance System...
        </div>
      </div>
    );
  }

  // --- Render for Authenticated Users: Clean SaaS Layout with Left Sidebar ---
  if (user) {
    return (
      <AppLayout
        activePage={activePage}
        onNavigate={handleNavigate}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        user={user}
        profile={profile}
        actionPlan={actionPlan}
        skillAssessmentResult={skillAssessmentResult}
        onProfileUpdated={setProfile}
        onLogout={handleLogout}
      >
        {authNotice && (
          <div style={{
            background: '#EEF2FF',
            border: '1px solid #C7D2FE',
            color: '#4F46E5',
            padding: '12px 18px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {authNotice}
          </div>
        )}

        {activePage === 'home' && (
          <HomePage
            activeCategory={activeCategory}
            onNavigate={handleNavigate}
            user={user}
          />
        )}

        {activePage === 'careers' && (
          <HomePage
            activeCategory={activeCategory}
            initialTab="careers"
            onNavigate={handleNavigate}
            user={user}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage
            user={user}
            profile={profile}
            assessmentResult={assessmentResult}
            skillAssessmentResult={skillAssessmentResult}
            onProfileUpdated={setProfile}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'careerDiscovery' && (
          <CareerDiscoveryPage
            user={user}
            onNavigate={handleNavigate}
            onSelectCareer={handleSelectCareerDetail}
            onDiscoveryCompleted={handleDiscoveryCompleted}
          />
        )}

        {activePage === 'assessment' && (
          <AssessmentPage
            user={user}
            onAssessmentSubmitted={handleAssessmentSubmitted}
            onNavigate={handleNavigate}
          />
        )}

        {(activePage === 'careerResults' || activePage === 'recommendations' || activePage === 'actionPlan') && (
          <CareerResultsPage
            user={user}
            assessmentResult={assessmentResult}
            onSelectCareer={handleSelectCareerDetail}
            onNavigate={handleNavigate}
            onTargetCareerUpdated={handleTargetCareerUpdated}
            initialTab={activePage === 'actionPlan' ? 'roadmap' : 'matches'}
          />
        )}

        {activePage === 'careerDetail' && (
          <CareerDetailPage
            careerId={selectedCareerId}
            assessmentResult={assessmentResult}
            onBack={() => setActivePage('careerResults')}
            onNavigate={handleNavigate}
            onTargetCareerUpdated={handleTargetCareerUpdated}
          />
        )}

        {activePage === 'assistant' && (
          <CareerAssistantPage
            onNavigate={handleNavigate}
            initialPrompt={assistantPrompt}
          />
        )}

        {activePage === 'interview' && (
          <InterviewPreparationPage
            onNavigate={handleNavigate}
            preselectedCareer={interviewPreselectedCareer}
          />
        )}

        {activePage === 'jobs' && (
          <JobsPage
            activeCategory={activeCategory}
            assessmentResult={assessmentResult}
            onSelectCareer={handleSelectCareerDetail}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'projects' && (
          <ProjectsPage
            activeCategory={activeCategory}
            assessmentResult={assessmentResult}
            onSelectProject={handleSelectProjectDetail}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'projectDetail' && (
          <ProjectDetailPage
            projectId={selectedProjectId}
            onBack={() => setActivePage('projects')}
            onNavigate={handleNavigate}
          />
        )}

        {/* Global SaaS App Footer */}
        <footer style={{
          marginTop: 48,
          paddingTop: 20,
          borderTop: '1px solid #E2E8F0',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#94A3B8'
        }}>
          Smart Career Guidance System &copy; 2026. Built with React (Vite), Python FastAPI, and MongoDB.
        </footer>
      </AppLayout>
    );
  }

  // --- Render for Unauthenticated Visitors ---
  if (activePage === 'home') {
    return (
      <PublicHomePage
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <GuestNavbar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area for Login / Signup */}
      <main style={{
        flex: 1,
        maxWidth: 600,
        width: '100%',
        margin: '0 auto',
        padding: '36px 20px 64px'
      }}>
        {authNotice && (
          <div style={{
            background: authNotice.toLowerCase().includes('success') ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${authNotice.toLowerCase().includes('success') ? '#A7F3D0' : '#FECACA'}`,
            color: authNotice.toLowerCase().includes('success') ? '#065F46' : '#991B1B',
            padding: '12px 18px',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: '0.9rem',
            fontWeight: 600,
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            {authNotice}
          </div>
        )}

        {activePage === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'signup' && (
          <SignupPage
            onSignupSuccess={handleSignupSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'careers' && (
          <HomePage
            activeCategory={activeCategory}
            initialTab="careers"
            onNavigate={handleNavigate}
            user={user}
          />
        )}
      </main>

      {/* Public Dark Navy Footer */}
      <PublicFooter onNavigate={handleNavigate} />
    </div>
  );
}
