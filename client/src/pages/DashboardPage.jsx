import React, { useState, useEffect } from 'react';
import {
  User,
  Compass,
  CheckSquare,
  Award,
  Target,
  Bot,
  Briefcase,
  FolderGit2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlayCircle,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Zap,
  BarChart3
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

export default function DashboardPage({
  user,
  profile: propProfile,
  assessmentResult,
  skillAssessmentResult: propSkillAssessment,
  onNavigate
}) {
  const [profile, setProfile] = useState(propProfile || null);
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [skillResult, setSkillResult] = useState(propSkillAssessment || null);
  const [actionPlan, setActionPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profData, discData, skillData, planData, projData, intData] = await Promise.all([
        getProfile().catch(() => propProfile || null),
        getDiscoveryResult().catch(() => null),
        getSkillAssessmentResult().catch(() => propSkillAssessment || null),
        getActionPlan().catch(() => null),
        getRecommendedProjects('all').catch(() => ({ projects: [] })),
        getInterviewHistory().catch(() => ({ history: [] }))
      ]);

      if (profData) setProfile(profData);
      if (discData?.success && discData?.result) setDiscoveryResult(discData.result);
      if (skillData && skillData.overall_accuracy !== undefined) setSkillResult(skillData);
      if (planData && planData.target_career_title) setActionPlan(planData);
      if (projData?.projects) setProjects(projData.projects);
      if (intData?.history) setInterviewHistory(intData.history);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async (projectId) => {
    try {
      setActionLoadingId(projectId);
      await startProject(projectId);
      // Update local state
      setProjects(prev => prev.map(p => {
        if (p.id === projectId || p.project_id === projectId) {
          return { ...p, status: 'In Progress', progress_percentage: 10 };
        }
        return p;
      }));
    } catch (e) {
      console.error('Failed to start project:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- 1. Compute Profile Completion Percentage ---
  const calculateProfileCompletion = () => {
    if (!profile) return 30; // base registered account
    let score = 0;
    const checks = [
      Boolean(profile.full_name || user?.full_name),
      Boolean(profile.email || user?.email),
      Boolean(profile.education_level),
      Boolean(profile.degree),
      Boolean(profile.branch),
      Boolean(profile.graduation_year),
      Boolean(profile.current_skills && profile.current_skills.length >= 2),
      Boolean(profile.interests && profile.interests.length >= 1),
      Boolean(profile.preferred_category)
    ];
    score = checks.filter(Boolean).length;
    return Math.round((score / checks.length) * 100);
  };

  const profilePct = calculateProfileCompletion();
  const isProfileComplete = profilePct >= 80;

  // --- 2. Compute Discovery & Skill Assessment State ---
  const isDiscoveryCompleted = Boolean(discoveryResult);
  const isSkillAssessmentCompleted = Boolean(skillResult && skillResult.overall_accuracy !== undefined);
  const hasActionPlan = Boolean(actionPlan && actionPlan.target_career_title);

  // Target Career from Action Plan or Profile or Recommendations
  const targetCareerTitle = actionPlan?.target_career_title ||
    (assessmentResult?.career_recommendations?.[0]?.title) ||
    null;

  const suitabilityScore = actionPlan?.suitability_score !== undefined
    ? actionPlan.suitability_score
    : (assessmentResult?.career_recommendations?.[0]?.suitability_score || null);

  const jobReadinessScore = actionPlan?.readiness_score !== undefined
    ? actionPlan.readiness_score
    : null;

  const roadmapProgressPct = actionPlan?.overall_progress_pct !== undefined
    ? actionPlan.overall_progress_pct
    : null;

  // Skill Gaps Count
  const skillGapsCount = actionPlan?.skill_gaps?.length !== undefined
    ? actionPlan.skill_gaps.length
    : (assessmentResult?.missing_skills?.length || 0);

  // Portfolio Progress
  const allProjectsList = actionPlan?.recommended_projects?.length
    ? actionPlan.recommended_projects
    : projects;

  const completedProjectsCount = allProjectsList.filter(p => p.status === 'Completed').length;
  const inProgressProjectsCount = allProjectsList.filter(p => p.status === 'In Progress').length;
  const totalProjectsCount = allProjectsList.length;

  // --- 3. Determine Dynamic Career Journey State (Requirement 4.B) ---
  let journeyMessage = '';
  let journeyActionLabel = '';
  let journeyTargetPage = '';

  if (!isProfileComplete) {
    journeyMessage = 'Complete your profile to get personalized career recommendations.';
    journeyActionLabel = 'Complete My Profile →';
    journeyTargetPage = 'profile';
  } else if (!isDiscoveryCompleted) {
    journeyMessage = 'Discover your career interests.';
    journeyActionLabel = 'Start Career Discovery →';
    journeyTargetPage = 'careerDiscovery';
  } else if (!isSkillAssessmentCompleted) {
    journeyMessage = 'Complete your skill assessment.';
    journeyActionLabel = 'Take Skill Assessment →';
    journeyTargetPage = 'assessment';
  } else if (!hasActionPlan) {
    journeyMessage = 'Explore your personalized career recommendations.';
    journeyActionLabel = 'View Recommendations →';
    journeyTargetPage = 'recommendations';
  } else {
    journeyMessage = 'Continue your career action plan.';
    journeyActionLabel = 'Continue Action Plan →';
    journeyTargetPage = 'actionPlan';
  }

  // --- 4. Prioritized Next Steps (Requirement 4.E) ---
  const nextSteps = [];

  if (!isProfileComplete) {
    nextSteps.push({
      id: 'step-profile',
      title: 'Complete missing profile details',
      desc: 'Add your education, branch, and current skill set for accurate matching.',
      page: 'profile',
      actionText: 'Update Profile'
    });
  }

  if (!isDiscoveryCompleted) {
    nextSteps.push({
      id: 'step-discovery',
      title: 'Finish Career Discovery',
      desc: 'Answer scenario questions to identify your natural work strengths and interests.',
      page: 'careerDiscovery',
      actionText: 'Start Discovery'
    });
  }

  if (!isSkillAssessmentCompleted) {
    nextSteps.push({
      id: 'step-assessment',
      title: 'Complete Skill Assessment',
      desc: 'Evaluate technical proficiency across core programming and domain topics.',
      page: 'assessment',
      actionText: 'Take Assessment'
    });
  }

  if (isProfileComplete && isSkillAssessmentCompleted && !hasActionPlan) {
    nextSteps.push({
      id: 'step-recommendations',
      title: 'Review Career Recommendations',
      desc: 'Select your target career from AI-ranked IT and Non-IT career pathways.',
      page: 'recommendations',
      actionText: 'Review Recommendations'
    });
  }

  if (hasActionPlan && roadmapProgressPct < 100) {
    nextSteps.push({
      id: 'step-actionplan',
      title: 'Follow the Career Action Plan',
      desc: `Focus on closing your top skill gaps for ${targetCareerTitle}.`,
      page: 'actionPlan',
      actionText: 'Open Action Plan'
    });
  }

  if (allProjectsList.length > 0 && completedProjectsCount < allProjectsList.length) {
    nextSteps.push({
      id: 'step-projects',
      title: 'Build a recommended portfolio project',
      desc: 'Create verified proof-of-work to showcase during technical job interviews.',
      page: 'projects',
      actionText: 'Browse Projects'
    });
  }

  // Fallback if all completed
  if (nextSteps.length === 0) {
    nextSteps.push({
      id: 'step-interview',
      title: 'Practice Mock Job Interviews',
      desc: 'Simulate technical and behavioral interviews tailored to your target role.',
      page: 'interview',
      actionText: 'Practice Now'
    });
  }

  // --- 5. Max 3 Recommended Projects (Requirement 4.F) ---
  const displayProjects = allProjectsList.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ========================================================
          A. WELCOME SECTION (Requirement 4.A)
      ======================================================== */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '28px 32px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="saas-badge badge-it">
              <Sparkles size={13} />
              AI-Powered Guidance Portal
            </span>
            {targetCareerTitle && (
              <span className="saas-badge badge-neutral">
                Target: <strong>{targetCareerTitle}</strong>
              </span>
            )}
          </div>

          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            lineHeight: 1.25
          }}>
            Welcome back, {user?.full_name || 'Student'}!
          </h2>

          <p style={{ fontSize: '0.92rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            {targetCareerTitle
              ? `You are on track toward becoming a ${targetCareerTitle}. Follow your personalized milestones below.`
              : 'Continue your journey toward finding and achieving your ideal career goal.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => onNavigate(journeyTargetPage)}
            className="btn btn-primary"
            style={{ padding: '11px 22px', fontSize: '0.9rem' }}
          >
            <span>{journeyActionLabel}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          B. CAREER JOURNEY CARD (Requirement 4.B)
      ======================================================== */}
      <div style={{
        background: '#EEF2FF',
        border: '1px solid #C7D2FE',
        borderRadius: 14,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#4F46E5',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44
          }}>
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#4F46E5', fontWeight: 800, letterSpacing: '0.04em' }}>
              Your Career Journey Stage
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E1B4B', marginTop: 2 }}>
              {journeyMessage}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate(journeyTargetPage)}
          className="btn"
          style={{
            background: '#4F46E5',
            color: '#FFFFFF',
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
          }}
        >
          <span>{journeyActionLabel}</span>
        </button>
      </div>

      {/* ========================================================
          C. SUMMARY CARDS (Requirement 4.C)
      ======================================================== */}
      <div className="grid-4">
        {/* Card 1: Profile Completion */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Profile Completion
            </span>
            <User size={18} color="#4F46E5" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {profilePct}%
            </span>
            <span className={`saas-badge ${profilePct >= 80 ? 'badge-success' : profilePct > 40 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
              {profilePct >= 80 ? 'Completed' : profilePct > 40 ? 'In Progress' : 'Pending'}
            </span>
          </div>

          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginTop: 12, marginBottom: 8 }}>
            <div style={{
              width: `${profilePct}%`,
              height: '100%',
              background: profilePct >= 80 ? '#059669' : '#4F46E5',
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {profile?.current_skills?.length || 0} skills listed
            </span>
            <button
              onClick={() => onNavigate('profile')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Update →
            </button>
          </div>
        </div>

        {/* Card 2: Skill Assessment Status */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Skill Assessment
            </span>
            <CheckSquare size={18} color="#7C3AED" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {isSkillAssessmentCompleted ? `${skillResult.overall_accuracy}%` : 'Pending'}
            </span>
            <span className={`saas-badge ${isSkillAssessmentCompleted ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
              {isSkillAssessmentCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>

          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginTop: 12, marginBottom: 8 }}>
            <div style={{
              width: `${isSkillAssessmentCompleted ? skillResult.overall_accuracy : 0}%`,
              height: '100%',
              background: '#7C3AED',
              borderRadius: 999
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {isSkillAssessmentCompleted ? `${skillResult.correct_answers || 0}/${skillResult.total_questions || 15} correct` : '15 questions'}
            </span>
            <button
              onClick={() => onNavigate('assessment')}
              style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              {isSkillAssessmentCompleted ? 'Retake →' : 'Start →'}
            </button>
          </div>
        </div>

        {/* Card 3: Skill Gaps */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Skill Gaps
            </span>
            <AlertTriangle size={18} color="#D97706" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {skillGapsCount}
            </span>
            <span className={`saas-badge ${skillGapsCount === 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
              {skillGapsCount === 0 ? 'No Gaps' : 'Identified'}
            </span>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '12px 0 8px 0', lineHeight: 1.4 }}>
            {actionPlan?.skill_gaps?.[0]?.skill_name
              ? `Top priority: ${actionPlan.skill_gaps[0].skill_name}`
              : 'Matched against target industry standards.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onNavigate('actionPlan')}
              style={{ background: 'none', border: 'none', color: '#D97706', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              View Gap Roadmap →
            </button>
          </div>
        </div>

        {/* Card 4: Portfolio Progress */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Portfolio Progress
            </span>
            <FolderGit2 size={18} color="#059669" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {completedProjectsCount} / {totalProjectsCount || 3}
            </span>
            <span className={`saas-badge ${completedProjectsCount > 0 ? 'badge-success' : inProgressProjectsCount > 0 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
              {completedProjectsCount > 0 ? `${completedProjectsCount} Completed` : inProgressProjectsCount > 0 ? 'In Progress' : 'Pending'}
            </span>
          </div>

          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginTop: 12, marginBottom: 8 }}>
            <div style={{
              width: `${totalProjectsCount > 0 ? Math.round((completedProjectsCount / totalProjectsCount) * 100) : 0}%`,
              height: '100%',
              background: '#059669',
              borderRadius: 999
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {inProgressProjectsCount} in progress
            </span>
            <button
              onClick={() => onNavigate('projects')}
              style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Browse Projects →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          D. CAREER PROGRESS SECTION (Requirement 4.D)
      ======================================================== */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="saas-badge badge-it">
                <Target size={13} /> Saved Target Career
              </span>
              {actionPlan?.target_career_category && (
                <span className="saas-badge badge-neutral">
                  {actionPlan.target_career_category}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {targetCareerTitle || 'Select a Target Career to Begin Roadmap'}
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '6px 0 0 0' }}>
              {targetCareerTitle
                ? 'Your personalized skill gap roadmap and job readiness tracking are synced below.'
                : 'Explore career recommendations to lock in your goal and generate an actionable milestone plan.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate(targetCareerTitle ? 'actionPlan' : 'recommendations')}
            className="btn btn-outline"
            style={{ padding: '9px 18px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <span>{targetCareerTitle ? 'Continue Career Action Plan →' : 'Explore Recommendations →'}</span>
          </button>
        </div>

        {/* 3 Metric Tiles: Suitability, Readiness, Roadmap Progress */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Career Suitability Score
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4F46E5', marginTop: 4 }}>
              {suitabilityScore !== null ? `${suitabilityScore}%` : 'Calculated after assessment'}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Weighted skill & discovery match
            </span>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Job Readiness Score
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
              {jobReadinessScore !== null ? `${jobReadinessScore}%` : 'Pending milestones'}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Readiness for entry-level positions
            </span>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Roadmap Completion
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                {roadmapProgressPct !== null ? `${roadmapProgressPct}%` : '0%'}
              </span>
            </div>
            <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 12, marginBottom: 8 }}>
              <div style={{
                width: `${roadmapProgressPct || 0}%`,
                height: '100%',
                background: '#4F46E5',
                borderRadius: 999,
                transition: 'width 0.4s ease'
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Milestone skills completed in action plan
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          E. RECOMMENDED NEXT STEPS (Requirement 4.E)
      ======================================================== */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Recommended Next Steps
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Prioritized guidance based strictly on your active career progress
            </span>
          </div>
          <span className="saas-badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            {nextSteps.length} Actions Needed
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nextSteps.map((step, idx) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 28
                }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>
                    {step.desc}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(step.page)}
                className="btn btn-outline"
                style={{ padding: '7px 14px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                <span>{step.actionText}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          F. RECOMMENDED PROJECTS (Requirement 4.F - MAX 3)
      ======================================================== */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="saas-badge badge-success">
                <FolderGit2 size={13} />
                Portfolio Readiness
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Recommended Portfolio Projects
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
              Targeted projects that close your top skill gaps and prove competence to hiring teams.
            </p>
          </div>

          <button
            onClick={() => onNavigate('projects')}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            <span>View All Projects →</span>
          </button>
        </div>

        {displayProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
            <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 12px 0' }}>
              Complete your assessment or view recommended projects for your career pathway.
            </p>
            <button
              onClick={() => onNavigate('projects')}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              Explore Projects Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {displayProjects.map((p, idx) => {
              const isCompleted = p.status === 'Completed';
              const isInProgress = p.status === 'In Progress';
              const progressPct = isCompleted ? 100 : (p.progress_percentage !== undefined ? p.progress_percentage : (isInProgress ? 50 : 0));

              return (
                <div
                  key={p.id || p.project_id || idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                        {p.title}
                      </h4>
                      <span className="saas-badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {p.difficulty || 'Intermediate'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {p.description ? (p.description.length > 100 ? `${p.description.slice(0, 100)}...` : p.description) : 'Practical portfolio project covering industry standards.'}
                    </p>

                    {/* Skills tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {(p.skills_covered || []).slice(0, 3).map((sk, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} />
                      <span>{p.estimated_duration || '3 - 4 Weeks'}</span>
                    </div>
                  </div>

                  {/* Progress bar & Action */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ color: isCompleted ? '#059669' : isInProgress ? '#D97706' : '#64748B' }}>
                        {isCompleted ? '✓ Completed' : isInProgress ? `${progressPct}% In Progress` : 'Not Started'}
                      </span>
                      <span style={{ color: '#94A3B8' }}>{progressPct}%</span>
                    </div>

                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background: isCompleted ? '#059669' : isInProgress ? '#D97706' : '#CBD5E1',
                        borderRadius: 999
                      }} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {isInProgress ? (
                        <button
                          onClick={() => onNavigate('projects')}
                          className="btn btn-outline"
                          style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          Continue Project →
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => onNavigate('projects')}
                          className="btn btn-outline"
                          style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}
                        >
                          View Details ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartProject(p.id || p.project_id)}
                          disabled={actionLoadingId === (p.id || p.project_id)}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          {actionLoadingId === (p.id || p.project_id) ? 'Starting...' : 'Start Project →'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          G. AI CAREER ASSISTANT & INTERVIEW PREP (Requirement 4.G)
      ======================================================== */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="saas-badge badge-it">
              <Bot size={13} />
              AI Career Copilot & Mock Interviews
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Instant AI Guidance & Interview Readiness
          </h3>

          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Ask questions regarding resume preparation, industry transition, technical questions, or conduct a timed mock interview tailored to your target career.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('assistant', { prompt: targetCareerTitle ? `What should I focus on this week to progress toward becoming a ${targetCareerTitle}?` : null })}
            className="btn btn-outline"
            style={{ padding: '9px 18px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Bot size={16} color="#4F46E5" />
            <span>Ask AI Assistant</span>
          </button>

          <button
            onClick={() => onNavigate('interview', { career: targetCareerTitle })}
            className="btn btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Briefcase size={16} />
            <span>Practice Mock Interview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
