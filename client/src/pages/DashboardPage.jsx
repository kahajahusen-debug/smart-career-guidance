import React from 'react';
import GlassCard from '../components/common/GlassCard';
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
  Sliders
} from 'lucide-react';

export default function DashboardPage({ user, profile, assessmentResult, skillAssessmentResult, onNavigate }) {
  const isAssessmentCompleted = !!(
    (assessmentResult && assessmentResult.career_recommendations?.length) ||
    (skillAssessmentResult && skillAssessmentResult.overall_accuracy !== undefined)
  );
  
  const topRecommendation = assessmentResult?.career_recommendations?.length ? assessmentResult.career_recommendations[0] : null;

  const skillsCount = profile?.current_skills?.length || 0;
  const missingSkillsCount = assessmentResult?.missing_skills?.length || 0;
  const projectsCount = assessmentResult?.recommended_projects?.length || 4;

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
              {isAssessmentCompleted ? 'Retake Assessment' : 'Start Assessment'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Status Notice Banner if Assessment Not Completed */}
      {!isAssessmentCompleted && (
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
                Career Assessment Incomplete
              </div>
              <div style={{ fontSize: '0.85rem', color: '#B45309' }}>
                Complete your interactive career assessment to calculate personalized suitability scores and missing skill gaps.
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
            Take Assessment Now →
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
              background: isAssessmentCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isAssessmentCompleted ? '#065F46' : '#92400E',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.88rem',
              fontWeight: 700
            }}>
              {isAssessmentCompleted ? '✓ Completed' : '⚠ Pending'}
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

        {/* Dedicated Skill Assessment Card */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED' }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', margin: 0 }}>Skill Assessment</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Test your technical & domain skills</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {isAssessmentCompleted ? 'Retake Assessment →' : 'Start Assessment →'}
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
