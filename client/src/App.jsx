import React, { useState, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import GuestNavbar from './components/common/GuestNavbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CareerDiscoveryPage from './pages/CareerDiscoveryPage';
import AssessmentPage from './pages/AssessmentPage';
import RecommendationsPage from './pages/RecommendationsPage';
import CareerDetailPage from './pages/CareerDetailPage';
import JobsPage from './pages/JobsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ActionPlanPage from './pages/ActionPlanPage';
import CareerAssistantPage from './pages/CareerAssistantPage';
import InterviewPreparationPage from './pages/InterviewPreparationPage';
import { fetchCurrentUser, getProfile, getAssessmentResult, getSkillAssessmentResult, getActionPlan } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
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

  // Check authentication status on startup
  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthChecking(false);
      return;
    }

    try {
      const userData = await fetchCurrentUser();
      setUser(userData);

      // Load user profile, skill assessment results, and action plan in background
      const [profData, skillData, planData] = await Promise.all([
        getProfile().catch(() => null),
        getSkillAssessmentResult().catch(() => null),
        getActionPlan().catch(() => null)
      ]);

      if (profData) setProfile(profData);
      if (skillData && skillData.success !== false) setSkillAssessmentResult(skillData);
      if (planData && !planData.detail) setActionPlan(planData);

      // If user was on home or guest pages, redirect to dashboard
      setActivePage((prev) => (prev === 'home' || prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
    } catch (err) {
      console.log('Session token expired or invalid:', err);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleNavigate = (targetPage, options = {}) => {
    setAuthNotice(null);
    const protectedPages = [
      'dashboard',
      'profile',
      'careerDiscovery',
      'assessment',
      'recommendations',
      'jobs',
      'projects',
      'projectDetail',
      'careerDetail',
      'actionPlan',
      'assistant',
      'interview'
    ];

    // Auth Guard
    if (protectedPages.includes(targetPage) && !user) {
      setAuthNotice('Please log in to access your personalized dashboard and career guidance features.');
      setActivePage('login');
      return;
    }

    if (options.prompt) setAssistantPrompt(options.prompt);
    if (options.career) setInterviewPreselectedCareer(options.career);

    setActivePage(targetPage);
  };

  const handleLoginSuccess = async (token, userData) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setAuthNotice(null);

    // Fetch user profile, skill assessment, and action plan
    try {
      const [profData, skillData, planData] = await Promise.all([
        getProfile().catch(() => null),
        getSkillAssessmentResult().catch(() => null),
        getActionPlan().catch(() => null)
      ]);
      if (profData) setProfile(profData);
      if (skillData && skillData.success !== false) setSkillAssessmentResult(skillData);
      if (planData && !planData.detail) setActionPlan(planData);
    } catch (e) {
      console.log('Error loading post-login data:', e);
    }

    // Direct redirect to personalized dashboard after login (Requirement 4 & 15)
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
    setAssessmentResult(null);
    setSkillAssessmentResult(null);
    setActionPlan(null);
    setActivePage('home');
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
    } catch (e) {}
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
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage
            user={user}
            onProfileUpdated={setProfile}
          />
        )}

        {activePage === 'careerDiscovery' && (
          <CareerDiscoveryPage
            user={user}
            onNavigate={handleNavigate}
            onSelectCareer={handleSelectCareerDetail}
          />
        )}

        {activePage === 'assessment' && (
          <AssessmentPage
            user={user}
            onAssessmentSubmitted={handleAssessmentSubmitted}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'recommendations' && (
          <RecommendationsPage
            assessmentResult={assessmentResult}
            activeCategory={activeCategory}
            onSelectCareer={handleSelectCareerDetail}
            onNavigate={handleNavigate}
            onTargetCareerUpdated={handleTargetCareerUpdated}
          />
        )}

        {activePage === 'careerDetail' && (
          <CareerDetailPage
            careerId={selectedCareerId}
            assessmentResult={assessmentResult}
            onBack={() => setActivePage('recommendations')}
            onNavigate={handleNavigate}
            onTargetCareerUpdated={handleTargetCareerUpdated}
          />
        )}

        {activePage === 'actionPlan' && (
          <ActionPlanPage
            onNavigate={handleNavigate}
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

  // --- Render for Unauthenticated Visitors: Clean SaaS Guest Shell ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <GuestNavbar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 48px'
      }}>
        {authNotice && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '12px 18px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: '0.88rem',
            fontWeight: 600,
            textAlign: 'center'
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

        {activePage === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'signup' && (
          <SignupPage
            onSignupSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Public Footer */}
      <footer style={{
        padding: '20px 24px',
        borderTop: '1px solid #E2E8F0',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: '#94A3B8',
        background: '#FFFFFF'
      }}>
        Smart Career Guidance System &copy; 2026. Built with React (Vite), Python FastAPI, and MongoDB.
      </footer>
    </div>
  );
}
