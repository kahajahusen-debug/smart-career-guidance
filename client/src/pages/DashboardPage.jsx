import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getActionPlan } from '../services/api';
import {
  User,
  HelpCircle,
  Award,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  FolderGit2,
  ChevronRight,
  TrendingUp,
  Sliders,
  Target,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function DashboardPage({ user, profile, assessmentResult, skillAssessmentResult, onNavigate }) {
  const [actionPlan, setActionPlan] = useState(null);

  useEffect(() => {
    getActionPlan()
      .then((plan) => setActionPlan(plan))
      .catch((err) => console.log('Action plan fetch error:', err));
  }, []);

  const isSkillAssessmentCompleted = !!(skillAssessmentResult && skillAssessmentResult.overall_accuracy !== undefined);
  const isAssessmentCompleted = isSkillAssessmentCompleted || !!(assessmentResult && assessmentResult.career_recommendations?.length);

  const topRecommendation = assessmentResult?.career_recommendations?.length ? assessmentResult.career_recommendations[0] : null;

  const skillsCount = profile?.current_skills?.length || 0;
  const missingSkillsCount = actionPlan?.missing_skills?.length || assessmentResult?.missing_skills?.length || 0;
  const projectsCount = actionPlan?.recommended_projects?.length || assessmentResult?.recommended_projects?.length || 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Welcome Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <CheckCircle size={14} /> Authenticated Student
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Welcome back, {user?.full_name || 'Candidate'}!
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#E2E8F0', marginTop: 8, maxWidth: 650 }}>
              Track your profile setup, skill gaps, personalized career benchmarks, and tailored portfolio projects.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onNavigate('profile')}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.88rem'
              }}
            >
              Edit Profile
            </button>
            <button
              onClick={() => onNavigate('assessment')}
              className="btn"
              style={{
                background: '#FFFFFF',
                color: '#172554',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.88rem'
              }}
            >
              {isSkillAssessmentCompleted ? 'Retake Assessment' : 'Start Assessment'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Status Notice Banner if Skill Assessment Not Completed */}
      {!isSkillAssessmentCompleted && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#92400E',
          padding: '18px 24px',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={24} color="#D97706" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                Skill Assessment Incomplete
              </div>
              <div style={{ fontSize: '0.85rem', color: '#B45309' }}>
                Complete your interactive skill assessment to evaluate your proficiency across technical & domain subjects.
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('assessment')}
            className="btn"
            style={{
              background: '#D97706',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            Take Skill Assessment Now →
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Assessment Status
            </span>
            <HelpCircle size={20} color="#4F46E5" />
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: isSkillAssessmentCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isSkillAssessmentCompleted ? '#065F46' : '#92400E',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.88rem',
              fontWeight: 700
            }}>
              {isSkillAssessmentCompleted
                ? `✓ Completed (${skillAssessmentResult.overall_accuracy}%)`
                : isAssessmentCompleted ? '✓ Completed' : '⚠ Pending'}
            </span>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Current Skills
            </span>
            <Sliders size={20} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', marginTop: 8 }}>
            {skillsCount}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>In profile matrix</span>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Skill Gaps
            </span>
            <AlertTriangle size={20} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', marginTop: 8 }}>
            {missingSkillsCount}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>To improve for target role</span>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Portfolio Projects
            </span>
            <FolderGit2 size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', marginTop: 8 }}>
            {projectsCount}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Recommended for portfolio</span>
        </GlassCard>
      </div>

      {/* Your Career Action Plan Card (Phase 6 Feature) */}
      <GlassCard style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.9) 100%)',
        borderLeft: '6px solid #4F46E5',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(79, 70, 229, 0.15)',
                color: '#4F46E5',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Target size={14} /> Phase 6 Feature
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#065F46',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                Active Roadmap
              </span>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Your Career Action Plan
            </h3>

            <p style={{ fontSize: '0.92rem', color: '#334155', marginTop: 6, maxWidth: 650 }}>
              Personalized skill gap roadmap and job readiness tracking for your target career.
            </p>
          </div>

          <button
            onClick={() => onNavigate('actionPlan')}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>View Career Action Plan →</span>
          </button>
        </div>

        {/* Action Plan Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          background: 'rgba(255, 255, 255, 0.75)',
          padding: '18px',
          borderRadius: 14,
          border: '1px solid rgba(199, 210, 254, 0.6)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Target Career
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', marginTop: 4 }}>
              {actionPlan?.target_career || topRecommendation?.title || 'Data Scientist & ML Engineer'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Suitability Score
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5', marginTop: 4 }}>
              {actionPlan?.suitability_score || topRecommendation?.suitability_score || 78.5}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Top Skill Gap
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}>
              {actionPlan?.skill_gaps?.[0]?.skill_name || actionPlan?.missing_skills?.[0] || 'Machine Learning'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Job Readiness
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {actionPlan?.readiness_score || 64}%
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: '#172554' }}>Career Roadmap Progress</span>
            <span style={{ color: '#4F46E5' }}>{actionPlan?.overall_progress_pct || 0}%</span>
          </div>
          <div style={{ height: 10, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${actionPlan?.overall_progress_pct || 0}%`,
              background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </GlassCard>

      {/* Featured Skill Assessment Section Card */}
      <GlassCard style={{
        padding: '28px',
        background: isSkillAssessmentCompleted
          ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(243, 232, 255, 0.9) 100%)',
        borderLeft: '6px solid #7C3AED',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(124, 58, 237, 0.15)',
                color: '#7C3AED',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <HelpCircle size={14} /> Phase 4 Feature
              </span>
              <span style={{
                background: isSkillAssessmentCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isSkillAssessmentCompleted ? '#065F46' : '#92400E',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {isSkillAssessmentCompleted ? '✓ Skill Assessment Completed' : '⚠ Skill Assessment Pending'}
              </span>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Skill Assessment
            </h3>

            <p style={{ fontSize: '0.92rem', color: '#334155', marginTop: 8, maxWidth: 680, lineHeight: 1.5 }}>
              Evaluate your technical and domain skill proficiency across programming, databases, machine learning, and core domain subjects. Receive categorized proficiency breakdown (Strong, Moderate, Needs Improvement) and career discovery alignment.
            </p>
          </div>

          {isSkillAssessmentCompleted && skillAssessmentResult && (
            <div style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 100%)',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: 16,
              textAlign: 'center',
              minWidth: 160
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#DDD6FE', fontWeight: 700 }}>
                Overall Accuracy
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#A78BFA' }}>
                {skillAssessmentResult.overall_accuracy}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#E9D5FF' }}>
                {skillAssessmentResult.correct_answers} / {skillAssessmentResult.total_questions} Correct
              </div>
            </div>
          )}
        </div>

        {/* Quick Skill Performance Breakdown preview if completed */}
        {isSkillAssessmentCompleted && skillAssessmentResult && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', padding: '12px 16px', borderRadius: 12 }}>
            {skillAssessmentResult.strong_skills?.length > 0 && (
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#047857' }}>Strong Skills (≥75%):</strong>{' '}
                <span style={{ color: '#065F46' }}>{skillAssessmentResult.strong_skills.join(', ')}</span>
              </div>
            )}
            {skillAssessmentResult.improve_skills?.length > 0 && (
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#B91C1C' }}>Needs Improvement (&lt;50%):</strong>{' '}
                <span style={{ color: '#991B1B' }}>{skillAssessmentResult.improve_skills.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: 14, marginTop: 4 }}>
          <button
            onClick={() => onNavigate('assessment')}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>{isSkillAssessmentCompleted ? 'Retake Assessment' : 'Start Assessment'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </GlassCard>

      {/* Top Career Recommendation Preview */}
      {isAssessmentCompleted && topRecommendation && (
        <GlassCard style={{ padding: '28px', borderLeft: '6px solid #4F46E5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="glass-badge badge-it">Top Recommendation</span>
                <span className={`glass-badge ${topRecommendation.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                  {topRecommendation.category}
                </span>
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                {topRecommendation.title}
              </h3>

              <p style={{ fontSize: '0.9rem', color: '#334155', marginTop: 8, maxWidth: 700 }}>
                {topRecommendation.description}
              </p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#C7D2FE', fontWeight: 700 }}>
                Suitability Score
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                {topRecommendation.suitability_score}%
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 20, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Matching Skills: <strong style={{ color: '#0F172A' }}>{topRecommendation.matching_skills?.join(', ') || 'Python, SQL'}</strong>
            </div>

            <button
              onClick={() => onNavigate('recommendations')}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <span>View All Recommendations</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
              <User size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', margin: 0 }}>My Profile</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Degree, skills & preferences</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}
          >
            Update Profile →
          </button>
        </GlassCard>

        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', margin: 0 }}>Career Discovery</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Interest & work style mapping</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('careerDiscovery')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}
          >
            Discover Areas →
          </button>
        </GlassCard>

        {/* Skill Assessment Navigation Card */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', margin: 0 }}>Skill Assessment</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                {isSkillAssessmentCompleted ? `✓ Completed (${skillAssessmentResult?.overall_accuracy}%)` : '⚠ Pending Assessment'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {isSkillAssessmentCompleted ? 'Retake Assessment →' : 'Start Assessment →'}
          </button>
        </GlassCard>

        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <Award size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', margin: 0 }}>Recommendations</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Personalized suitability rankings</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('recommendations')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}
          >
            View Recommendations →
          </button>
        </GlassCard>

        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <Briefcase size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', margin: 0 }}>Recommended Jobs</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Open roles on LinkedIn & Naukri</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}
          >
            Explore Jobs →
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
