import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AssessmentPage from './pages/AssessmentPage';
import RecommendationsPage from './pages/RecommendationsPage';
import CareerDetailPage from './pages/CareerDetailPage';
import JobsPage from './pages/JobsPage';
import ProjectsPage from './pages/ProjectsPage';
import { fetchCurrentUser, getProfile, getAssessmentResult } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [selectedCareerId, setSelectedCareerId] = useState(null);
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
      
      // Load user profile & assessment results in background
      const [profData, assData] = await Promise.all([
        getProfile().catch(() => null),
        getAssessmentResult().catch(() => null)
      ]);

      if (profData) setProfile(profData);
      if (assData) setAssessmentResult(assData);
    } catch (err) {
      console.log('Session token expired or invalid:', err);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleNavigate = (targetPage) => {
    setAuthNotice(null);
    const protectedPages = ['dashboard', 'profile', 'assessment', 'recommendations', 'jobs', 'projects', 'careerDetail'];
    
    // Auth Route Guard
    if (protectedPages.includes(targetPage) && !user) {
      setAuthNotice('Please log in to access your personalized dashboard and career guidance features.');
      setActivePage('login');
      return;
    }

    setActivePage(targetPage);
  };

  const handleLoginSuccess = async (token, userData) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setAuthNotice(null);

    // Fetch user profile & assessment
    try {
      const [profData, assData] = await Promise.all([
        getProfile().catch(() => null),
        getAssessmentResult().catch(() => null)
      ]);
      if (profData) setProfile(profData);
      if (assData) setAssessmentResult(assData);
    } catch (e) {
      console.log('Error loading post-login data:', e);
    }

    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
    setAssessmentResult(null);
    setActivePage('home');
  };

  const handleSelectCareerDetail = (careerId) => {
    setSelectedCareerId(careerId);
    setActivePage('careerDetail');
  };

  const handleAssessmentSubmitted = (result) => {
    setAssessmentResult(result);
    setActivePage('recommendations');
  };

  if (authChecking) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Initializing Smart Career Guidance System...
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        activePage={activePage}
        onNavigate={handleNavigate}
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Auth Notice Alert Banner */}
      {authNotice && (
        <div style={{
          background: 'rgba(79, 70, 229, 0.12)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          color: '#3730A3',
          padding: '12px 20px',
          borderRadius: 12,
          marginBottom: 20,
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {authNotice}
        </div>
      )}

      <main>
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

        {activePage === 'dashboard' && (
          <DashboardPage 
            user={user}
            profile={profile}
            assessmentResult={assessmentResult}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage 
            user={user}
            onProfileUpdated={setProfile}
          />
        )}

        {activePage === 'assessment' && (
          <AssessmentPage 
            user={user}
            onAssessmentSubmitted={handleAssessmentSubmitted}
          />
        )}

        {activePage === 'recommendations' && (
          <RecommendationsPage 
            assessmentResult={assessmentResult}
            activeCategory={activeCategory}
            onSelectCareer={handleSelectCareerDetail}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'careerDetail' && (
          <CareerDetailPage 
            careerId={selectedCareerId}
            assessmentResult={assessmentResult}
            onBack={() => setActivePage('recommendations')}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'jobs' && (
          <JobsPage 
            activeCategory={activeCategory}
            assessmentResult={assessmentResult}
          />
        )}

        {activePage === 'projects' && (
          <ProjectsPage 
            activeCategory={activeCategory}
            assessmentResult={assessmentResult}
          />
        )}
      </main>

      <footer style={{
        marginTop: 64,
        paddingTop: 24,
        borderTop: '1px solid #E2E8F0',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748B'
      }}>
        Smart Career Guidance System &copy; 2026. Built with React (Vite), Python FastAPI, and MongoDB.
      </footer>
    </div>
  );
}
