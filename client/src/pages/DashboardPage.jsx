import React, { useState, useEffect } from 'react';
import {
  User,
  CheckSquare,
  Target,
  Bot,
  FolderGit2,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Cloud,
  Globe,
  Code2,
  ListOrdered,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  getActionPlan,
  getProfile,
  getDiscoveryResult,
  getSkillAssessmentResult,
  getRecommendedProjects,
  getInterviewHistory,
  startProject
} from '../services/api';
import { calculateProfileCompletion } from '../utils/profileCompletion';

// --- Hero Desk Illustration Component (SVG matching screenshot) ---
function HeroDeskIllustration() {
  return (
    <svg
      width="250"
      height="140"
      viewBox="0 0 250 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: '100%', height: 'auto', flexShrink: 0 }}
    >
      {/* Soft background blob */}
      <ellipse cx="140" cy="80" rx="90" ry="50" fill="#EFF6FF" />
      <ellipse cx="195" cy="65" rx="40" ry="30" fill="#EEF2FF" />

      {/* Floating Bar Chart Card */}
      <rect x="45" y="25" width="56" height="40" rx="6" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(15,23,42,0.06))" />
      <line x1="52" y1="35" x2="94" y2="35" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" />
      <rect x="56" y="45" width="5" height="14" rx="1.5" fill="#93C5FD" />
      <rect x="65" y="40" width="5" height="19" rx="1.5" fill="#60A5FA" />
      <rect x="74" y="35" width="5" height="24" rx="1.5" fill="#3B82F6" />
      <rect x="83" y="48" width="5" height="11" rx="1.5" fill="#BFDBFE" />

      {/* Floating Line Chart */}
      <rect x="98" y="12" width="50" height="32" rx="6" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(15,23,42,0.06))" />
      <path d="M104 31 L114 24 L125 28 L138 18" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="114" cy="24" r="2" fill="#4F46E5" />
      <circle cx="125" cy="28" r="2" fill="#4F46E5" />
      <circle cx="138" cy="18" r="2" fill="#4F46E5" />

      {/* Floating Purple Brain Circle with sparkles */}
      <circle cx="190" cy="30" r="18" fill="#818CF8" />
      <circle cx="190" cy="30" r="15" fill="#6366F1" />
      {/* Brain folds */}
      <path d="M185 27 C183 27 182 29 182 30 C182 32 183 33 184 33.5 C184 34.5 185 35.5 186 36 L188 36 L188 27 Z" fill="#FFFFFF" opacity="0.95" />
      <path d="M195 27 C197 27 198 29 198 30 C198 32 197 33 196 33.5 C196 34.5 195 35.5 194 36 L192 36 L192 27 Z" fill="#FFFFFF" opacity="0.95" />
      {/* Sparkles */}
      <path d="M168 18 L170 20 L173 22 L170 24 L168 26 L166 24 L163 22 L166 20 Z" fill="#F59E0B" />
      <circle cx="210" cy="20" r="1.5" fill="#F59E0B" />
      <circle cx="212" cy="40" r="1.5" fill="#818CF8" />

      {/* Desk and Figure */}
      <ellipse cx="175" cy="130" rx="42" ry="5" fill="#E2E8F0" />
      <rect x="140" y="108" width="75" height="4" rx="2" fill="#CBD5E1" />

      {/* Developer Figure */}
      <circle cx="182" cy="76" r="9" fill="#FED7AA" />
      <path d="M175 76 C175 69 180 65 187 65 C192 65 194 70 194 76 C194 79 193 82 192 84 C191 84 188 82 187 80 C185 80 182 82 178 84 C177 82 175 79 175 76 Z" fill="#1E293B" />
      <path d="M176 86 C174 91 172 108 172 112 L196 112 C196 108 193 91 190 86 Z" fill="#2563EB" />
      <path d="M177 92 L164 103 L170 107 L181 97 Z" fill="#1D4ED8" />

      {/* Laptop */}
      <rect x="150" y="97" width="20" height="13" rx="1.5" fill="#0F172A" />
      <rect x="152" y="99" width="16" height="9" rx="1" fill="#38BDF8" />
      <line x1="146" y1="110" x2="174" y2="110" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

      {/* Potted Plant */}
      <path d="M208 104 L216 104 L214 112 L210 112 Z" fill="#94A3B8" />
      <ellipse cx="212" cy="98" rx="2.5" ry="5" fill="#10B981" transform="rotate(-15 212 98)" />
      <ellipse cx="215" cy="99" rx="2.5" ry="4" fill="#059669" transform="rotate(25 215 99)" />
    </svg>
  );
}

// --- Donut Ring Progress Component ---
function DonutProgress({
  percentage = null,
  size = 110,
  strokeWidth = 10,
  strokeColor = '#10B981',
  trackColor = '#F1F5F9',
  label = '',
  showPercentage = true
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isNumber = typeof percentage === 'number' && !isNaN(percentage);
  const validPct = isNumber ? Math.min(Math.max(percentage, 0), 100) : 0;
  const offset = circumference - (validPct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {isNumber && validPct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>
      {showPercentage && (
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size > 80 ? '1.5rem' : '0.8rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {isNumber ? `${percentage}%` : '—'}
          </span>
          {label && <span style={{ fontSize: '0.62rem', color: '#64748B', marginTop: 2 }}>{label}</span>}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({
  user,
  profile: propProfile,
  assessmentResult,
  skillAssessmentResult: propSkillAssessment,
  onNavigate,
  onOpenSettings
}) {
  const [profile, setProfile] = useState(propProfile || null);
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [skillResult, setSkillResult] = useState(propSkillAssessment || null);
  const [actionPlan, setActionPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectSummary, setProjectSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profData, discData, skillData, planData, projData] = await Promise.all([
        getProfile().catch(() => propProfile || null),
        getDiscoveryResult().catch(() => null),
        getSkillAssessmentResult().catch(() => propSkillAssessment || null),
        getActionPlan().catch(() => null),
        getRecommendedProjects('all').catch(() => ({ projects: [], summary: {} }))
      ]);

      if (profData) setProfile(profData);
      if (discData?.success && discData?.result) setDiscoveryResult(discData.result);
      if (skillData && skillData.overall_accuracy !== undefined) setSkillResult(skillData);
      if (planData && !planData.detail) setActionPlan(planData);
      if (projData?.projects) {
        setProjects(projData.projects);
        if (projData.summary) setProjectSummary(projData.summary);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Real Profile Completion Calculation ---
  const completionStats = calculateProfileCompletion(profile, user);
  const profilePct = completionStats.percentage;
  const isProfileComplete = profilePct >= 100;

  // --- Assessment & Discovery State ---
  const isDiscoveryCompleted = Boolean(discoveryResult);
  const isSkillAssessmentCompleted = Boolean(skillResult && skillResult.overall_accuracy !== undefined);
  const assessmentAccuracy = isSkillAssessmentCompleted ? skillResult.overall_accuracy : null;

  // --- Target Career & Progress (Strictly Real) ---
  const hasUserSelectedTarget = Boolean(
    actionPlan?.has_user_selected_target !== false &&
    actionPlan?.target_career_title &&
    actionPlan?.status !== 'Not Created'
  );
  const targetCareerTitle = hasUserSelectedTarget ? actionPlan.target_career_title : 'Not Selected';
  const targetCareerCategory = hasUserSelectedTarget
    ? (actionPlan.target_career_category || profile?.preferred_category || 'IT')
    : (profile?.preferred_category || 'Pending');

  // Suitability & Readiness (Strictly Real, No Sample Fabrication)
  const suitabilityScore = hasUserSelectedTarget && typeof actionPlan?.suitability_score === 'number'
    ? actionPlan.suitability_score
    : null;

  const jobReadinessScore = hasUserSelectedTarget && typeof actionPlan?.readiness_score === 'number'
    ? actionPlan.readiness_score
    : null;

  // Roadmap & Milestones (Strictly Real, No Sample Fabrication)
  const hasRoadmap = hasUserSelectedTarget && Array.isArray(actionPlan?.milestones) && actionPlan.milestones.length > 0;
  const milestonesCompleted = hasRoadmap
    ? actionPlan.milestones.filter(m => m.completed || m.status === 'Completed').length
    : 0;
  const totalMilestones = hasRoadmap ? actionPlan.milestones.length : 0;
  const roadmapProgressPct = hasRoadmap && totalMilestones > 0
    ? Math.round((milestonesCompleted / totalMilestones) * 100)
    : 0;

  // Skill Gaps Count (Strictly Real)
  const hasSkillGapsData = isSkillAssessmentCompleted && Array.isArray(actionPlan?.skill_gaps);
  const skillGapsCount = hasSkillGapsData ? actionPlan.skill_gaps.length : null;

  // Projects Catalog (Strictly Real User Progress)
  const defaultProjects = [
    {
      id: 'proj_da',
      title: 'Data Analysis Dashboard',
      difficulty: 'Intermediate',
      difficultyColor: '#D97706',
      difficultyBg: '#FEF3C7',
      technologies: ['Python', 'Pandas', 'Matplotlib'],
      progress_percentage: 0,
      icon: TrendingUp,
      actionText: 'Start Project'
    },
    {
      id: 'proj_wp',
      title: 'Weather Prediction App',
      difficulty: 'Beginner',
      difficultyColor: '#16A34A',
      difficultyBg: '#DCFCE7',
      technologies: ['Python', 'Machine Learning', 'API'],
      progress_percentage: 0,
      icon: Cloud,
      actionText: 'Start Project'
    },
    {
      id: 'proj_pw',
      title: 'Personal Portfolio Website',
      difficulty: 'Beginner',
      difficultyColor: '#16A34A',
      difficultyBg: '#DCFCE7',
      technologies: ['React', 'CSS', 'JavaScript'],
      progress_percentage: 0,
      icon: Globe,
      actionText: 'Start Project'
    }
  ];

  const rawProjects = Array.isArray(projects) && projects.length > 0 ? projects : defaultProjects;
  const displayProjects = rawProjects.slice(0, 3).map((p, i) => {
    const fallback = defaultProjects[i] || defaultProjects[0];
    const pct = typeof p.progress_percentage === 'number' ? p.progress_percentage : 0;
    const isCompleted = p.status === 'Completed' || pct >= 100;
    const isStarted = pct > 0 || p.status === 'In Progress';
    return {
      id: p.id || p.project_id || fallback.id,
      title: p.title || fallback.title,
      difficulty: p.difficulty || fallback.difficulty,
      difficultyColor: p.difficulty === 'Beginner' ? '#16A34A' : '#D97706',
      difficultyBg: p.difficulty === 'Beginner' ? '#DCFCE7' : '#FEF3C7',
      technologies: (p.technologies || p.skills_covered || fallback.technologies).slice(0, 3),
      progress_percentage: pct,
      icon: fallback.icon,
      status: p.status || (isCompleted ? 'Completed' : (isStarted ? 'In Progress' : 'Not Started')),
      actionText: isCompleted ? 'Completed' : (isStarted ? 'Continue' : 'Start Project')
    };
  });

  const completedProjectsCount = projectSummary?.completed_count !== undefined
    ? projectSummary.completed_count
    : displayProjects.filter(p => p.status === 'Completed').length;

  const inProgressProjectsCount = projectSummary?.in_progress_count !== undefined
    ? projectSummary.in_progress_count
    : displayProjects.filter(p => p.status === 'In Progress').length;

  const totalProjectsCount = 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ========================================================
          ROW 1: Target Career Hero Banner (2fr) + Profile Strength (1fr)
      ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 20
      }} className="dashboard-hero-row">
        {/* Hero Card: Your Target Career */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minWidth: 0,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: hasUserSelectedTarget ? '#EEF2FF' : '#F1F5F9',
                color: hasUserSelectedTarget ? '#4F46E5' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={16} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: hasUserSelectedTarget ? '#4F46E5' : '#64748B' }}>
                Your Target Career
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: hasUserSelectedTarget ? '#0F172A' : '#475569',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.2
              }}>
                {targetCareerTitle}
              </h2>
            </div>

            <div>
              <span style={{
                display: 'inline-block',
                background: hasUserSelectedTarget ? '#EEF2FF' : '#F1F5F9',
                color: hasUserSelectedTarget ? '#4F46E5' : '#64748B',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 999
              }}>
                {hasUserSelectedTarget ? 'In Progress' : 'Not Selected'}
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              <button
                onClick={() => onNavigate(hasUserSelectedTarget ? 'actionPlan' : 'recommendations')}
                className="btn btn-primary"
                style={{
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{hasUserSelectedTarget ? 'Continue Journey' : 'Choose Target Career'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Vector Illustration */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <HeroDeskIllustration />
          </div>
        </div>

        {/* Profile Strength Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '24px 20px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div style={{ width: '100%', textAlign: 'left', marginBottom: 8 }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Profile Strength
            </h3>
          </div>

          <div style={{ margin: '8px 0' }}>
            <DonutProgress
              percentage={profilePct}
              size={120}
              strokeWidth={11}
              strokeColor="#10B981"
              trackColor="#F1F5F9"
            />
          </div>

          <button
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings('profile');
              } else {
                onNavigate('dashboard');
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#4F46E5',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 0
            }}
          >
            <span>{profilePct >= 100 ? 'View profile details' : 'Complete your profile'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================
          ROW 2: 4 Summary KPI Cards
      ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 16
      }} className="dashboard-kpi-row">
        {/* Card 1: Profile */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#EEF2FF',
              color: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} />
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>
              Profile
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {profilePct}%
            </span>
            <DonutProgress
              percentage={profilePct}
              size={38}
              strokeWidth={5}
              strokeColor="#10B981"
              trackColor="#F1F5F9"
              showPercentage={false}
            />
          </div>

          <div>
            <span style={{
              display: 'inline-block',
              background: profilePct >= 100 ? '#ECFDF5' : (profilePct > 0 ? '#FEF3C7' : '#F1F5F9'),
              color: profilePct >= 100 ? '#065F46' : (profilePct > 0 ? '#D97706' : '#64748B'),
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 999
            }}>
              {profilePct >= 100 ? 'Completed' : (profilePct > 0 ? 'In Progress' : 'Not Started')}
            </span>
          </div>
        </div>

        {/* Card 2: Assessment */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: isSkillAssessmentCompleted ? '#ECFDF5' : '#F1F5F9',
              color: isSkillAssessmentCompleted ? '#10B981' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckSquare size={18} />
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>
              Assessment
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: isSkillAssessmentCompleted ? '1.75rem' : '1.25rem', fontWeight: 800, color: isSkillAssessmentCompleted ? '#0F172A' : '#64748B', letterSpacing: '-0.02em' }}>
              {isSkillAssessmentCompleted ? `${assessmentAccuracy}%` : 'Not Assessed'}
            </span>
            <DonutProgress
              percentage={isSkillAssessmentCompleted ? assessmentAccuracy : null}
              size={38}
              strokeWidth={5}
              strokeColor="#10B981"
              trackColor="#F1F5F9"
              showPercentage={false}
            />
          </div>

          <div>
            <span style={{
              display: 'inline-block',
              background: isSkillAssessmentCompleted ? '#EEF2FF' : '#F1F5F9',
              color: isSkillAssessmentCompleted ? '#6366F1' : '#64748B',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 999
            }}>
              {isSkillAssessmentCompleted ? 'Completed' : 'Not Assessed'}
            </span>
          </div>
        </div>

        {/* Card 3: Skill Gaps */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: hasSkillGapsData ? '#FFF1F2' : '#F1F5F9',
              color: hasSkillGapsData ? '#F43F5E' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={18} />
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>
              Skill Gaps
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: hasSkillGapsData ? '1.75rem' : '1.25rem', fontWeight: 800, color: hasSkillGapsData ? '#0F172A' : '#64748B', letterSpacing: '-0.02em' }}>
              {hasSkillGapsData ? skillGapsCount : 'Not Assessed'}
            </span>
            {hasSkillGapsData && (
              <span style={{ color: skillGapsCount > 0 ? '#E11D48' : '#10B981', fontSize: '1.1rem', fontWeight: 800 }}>↗</span>
            )}
          </div>

          <div>
            <span style={{
              display: 'inline-block',
              background: hasSkillGapsData ? (skillGapsCount > 0 ? '#FEE2E2' : '#DCFCE7') : '#F1F5F9',
              color: hasSkillGapsData ? (skillGapsCount > 0 ? '#E11D48' : '#16A34A') : '#64748B',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 999
            }}>
              {hasSkillGapsData ? (skillGapsCount > 0 ? 'Needs Attention' : 'Optimal') : 'Not Assessed'}
            </span>
          </div>
        </div>

        {/* Card 4: Projects */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#EFF6FF',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FolderGit2 size={18} />
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>
                Projects
              </span>
            </div>

            <span style={{
              display: 'inline-block',
              background: completedProjectsCount > 0 || inProgressProjectsCount > 0 ? '#FEF3C7' : '#F1F5F9',
              color: completedProjectsCount > 0 || inProgressProjectsCount > 0 ? '#D97706' : '#64748B',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999
            }}>
              {completedProjectsCount > 0 || inProgressProjectsCount > 0 ? 'In Progress' : 'Not Started'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {completedProjectsCount}/{totalProjectsCount}
            </span>
          </div>

          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
            <div style={{
              width: `${totalProjectsCount > 0 ? Math.round((completedProjectsCount / totalProjectsCount) * 100) : 0}%`,
              height: '100%',
              background: '#4F46E5',
              borderRadius: 999
            }} />
          </div>
        </div>
      </div>

      {/* ========================================================
          ROW 3: Your Career Progress (2fr) + Next Steps (1fr)
      ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 20
      }} className="dashboard-progress-row">
        {/* Your Career Progress */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '22px 26px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#2563EB" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Your Career Progress
            </h3>
          </div>

          {/* Career Title & Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: hasUserSelectedTarget ? '#4F46E5' : '#94A3B8',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: hasUserSelectedTarget ? '#0F172A' : '#64748B' }}>
                {targetCareerTitle}
              </span>
              <span style={{
                background: hasUserSelectedTarget ? '#EEF2FF' : '#F1F5F9',
                color: hasUserSelectedTarget ? '#4F46E5' : '#64748B',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4
              }}>
                {targetCareerCategory}
              </span>
            </div>
          </div>

          {/* Metrics Row: Suitability Score + Job Readiness + Roadmap Progress */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto minmax(0, 1fr)',
            gap: 24,
            alignItems: 'center'
          }} className="dashboard-metrics-grid">
            {/* Suitability Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                Suitability Score
              </span>
              <DonutProgress
                percentage={suitabilityScore}
                size={54}
                strokeWidth={5}
                strokeColor="#14B8A6"
                trackColor="#F1F5F9"
              />
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                {suitabilityScore !== null ? `${suitabilityScore}% match` : 'Not Assessed'}
              </span>
            </div>

            {/* Job Readiness */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                Job Readiness
              </span>
              <DonutProgress
                percentage={jobReadinessScore}
                size={54}
                strokeWidth={5}
                strokeColor="#3B82F6"
                trackColor="#F1F5F9"
              />
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                {jobReadinessScore !== null ? `${jobReadinessScore}% ready` : 'Not Assessed'}
              </span>
            </div>

            {/* Roadmap Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                  Roadmap Progress
                </span>
                <span style={{ fontSize: '0.78rem', color: hasRoadmap ? '#0F172A' : '#64748B', fontWeight: 700 }}>
                  {hasRoadmap ? `${milestonesCompleted} / ${totalMilestones} milestones` : 'Not Created'}
                </span>
              </div>

              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${roadmapProgressPct}%`,
                  height: '100%',
                  background: '#14B8A6',
                  borderRadius: 999
                }} />
              </div>

              <div style={{ marginTop: 6 }}>
                <button
                  onClick={() => onNavigate(hasRoadmap ? 'actionPlan' : 'recommendations')}
                  style={{
                    width: '100%',
                    background: '#F1F5F9',
                    border: 'none',
                    color: '#4F46E5',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span>{hasRoadmap ? 'View Roadmap' : 'Create Action Plan'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '22px 24px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListOrdered size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Next Steps
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Step 1 */}
            <div
              onClick={() => {
                if (onOpenSettings) onOpenSettings('profile');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isProfileComplete ? '#10B981' : '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isProfileComplete ? '✓' : '1'}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                    {isProfileComplete ? 'Profile completed' : 'Complete your profile'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {isProfileComplete ? 'Qualifications verified' : 'Get tailored recommendations'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>

            {/* Step 2 */}
            <div
              onClick={() => onNavigate('assessment')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isSkillAssessmentCompleted ? '#10B981' : '#F59E0B',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isSkillAssessmentCompleted ? '✓' : '2'}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                    {isSkillAssessmentCompleted ? 'Assessment completed' : 'Take skill assessment'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {isSkillAssessmentCompleted ? `${assessmentAccuracy}% accuracy score` : 'Find your skill gaps'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>

            {/* Step 3 */}
            <div
              onClick={() => onNavigate('recommendations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: hasUserSelectedTarget ? '#10B981' : '#6366F1',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {hasUserSelectedTarget ? '✓' : '3'}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                    {hasUserSelectedTarget ? 'Career selected' : 'Explore & choose career'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {hasUserSelectedTarget ? targetCareerTitle : 'Discover matched roles'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          ROW 4: Recommended Projects (2fr) + AI Career Coach (1fr)
      ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 20
      }} className="dashboard-bottom-row">
        {/* Recommended Projects Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '22px 26px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={18} color="#4F46E5" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Recommended Projects
              </h3>
            </div>

            <button
              onClick={() => onNavigate('projects')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 Project Cards in a row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 14
          }} className="dashboard-projects-grid">
            {displayProjects.map((p) => {
              const Icon = p.icon || Code2;
              return (
                <div
                  key={p.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #F1F5F9',
                    borderRadius: 12,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Icon + Title + Difficulty */}
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} />
                    </div>

                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                      {p.title}
                    </div>

                    <div>
                      <span style={{
                        display: 'inline-block',
                        background: p.difficultyBg,
                        color: p.difficultyColor,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {p.difficulty}
                      </span>
                    </div>

                    {/* Skill Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(p.technologies || []).map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Progress & Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          width: `${p.progress_percentage || 0}%`,
                          height: '100%',
                          background: (p.progress_percentage || 0) > 0 ? '#10B981' : 'transparent',
                          borderRadius: 999
                        }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
                        {p.progress_percentage || 0}%
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate('projects')}
                      className="btn"
                      style={{
                        width: '100%',
                        background: '#FFFFFF',
                        border: '1px solid #C7D2FE',
                        color: '#4F46E5',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      {p.actionText || 'Start Project'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your AI Career Coach Card */}
        <div style={{
          background: '#FAFAFF',
          borderRadius: 16,
          padding: '22px 24px',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          border: '1px solid #E0E7FF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 14
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Header with bot icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#4F46E5',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Your AI Career Coach
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
              Get personalized guidance, answer your questions and prepare for interviews.
            </p>

            {/* Two Action Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => onNavigate('assistant')}
                className="btn"
                style={{
                  flex: 1,
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                Ask AI
              </button>

              <button
                onClick={() => onNavigate('interview')}
                className="btn"
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  border: '1px solid #C7D2FE',
                  color: '#4F46E5',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Mock Interview
              </button>
            </div>
          </div>

          {/* Try Asking Prompt Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              Try asking:
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'What skills do I need?',
                'How to improve my resume?',
                'Best projects for my career'
              ].map((promptText, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onNavigate('assistant', { prompt: promptText })}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 999,
                    padding: '5px 12px',
                    fontSize: '0.72rem',
                    color: '#334155',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C7D2FE';
                    e.currentTarget.style.color = '#4F46E5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Media queries for responsiveness */}
      <style>{`
        @media (max-width: 1024px) {
          .dashboard-hero-row,
          .dashboard-progress-row,
          .dashboard-bottom-row {
            grid-template-columns: 1fr !important;
          }
          .dashboard-kpi-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dashboard-projects-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 640px) {
          .dashboard-kpi-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
