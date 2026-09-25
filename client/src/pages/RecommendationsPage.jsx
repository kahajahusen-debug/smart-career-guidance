import React from 'react';
import GlassCard from '../components/common/GlassCard';
import { Award, CheckCircle2, AlertCircle, DollarSign, TrendingUp, ChevronRight, HelpCircle } from 'lucide-react';

export default function RecommendationsPage({ assessmentResult, activeCategory, onSelectCareer, onNavigate }) {
  if (!assessmentResult || !assessmentResult.career_recommendations?.length) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#D97706',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <HelpCircle size={28} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#172554', marginBottom: 8 }}>
          No Recommendations Found Yet
        </h3>
        <p style={{ fontSize: '0.92rem', color: '#64748B', maxWidth: 520, margin: '0 auto 24px auto' }}>
          Please complete your interactive career assessment to calculate dynamic suitability scores and personalized recommendations.
        </p>
        <button
          onClick={() => onNavigate('assessment')}
          className="btn"
          style={{
            background: '#172554',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          Start Assessment Now →
        </button>
      </GlassCard>
    );
  }

  const recommendations = assessmentResult.career_recommendations;
  const filteredRecs = recommendations.filter((rec) => {
    if (!activeCategory || activeCategory === 'all') return true;
    return rec.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Award size={20} color="#FBBF24" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase' }}>
                AI Recommendation Engine
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              Personalized Career Recommendations
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#E2E8F0', marginTop: 6 }}>
              Rankings calculated dynamically based on your skill matrix, quiz accuracy ({assessmentResult.assessment_score}%), and interests.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '12px 20px',
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#E2E8F0', display: 'block' }}>Assessment Score</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{assessmentResult.assessment_score}%</span>
          </div>
        </div>
      </GlassCard>

      {/* Recommendation Cards List */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {filteredRecs.map((rec) => {
          const matchingList = rec.matching_skills || [];
          const missingItems = rec.skill_gaps?.filter((g) => g.status === 'Improve') || [];

          return (
            <GlassCard key={rec.career_id} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    {rec.title}
                  </h3>
                  <div style={{ marginTop: 6 }}>
                    <span className={`glass-badge ${rec.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                      {rec.category} Pathway
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 12,
                  textAlign: 'center',
                  minWidth: 80
                }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#C7D2FE', fontWeight: 700 }}>
                    Match
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                    {rec.suitability_score}%
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>
                {rec.description}
              </p>

              {/* Salary & Growth Stats */}
              <div style={{ display: 'flex', gap: 16, background: '#F8FAFC', padding: 10, borderRadius: 10, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} color="#10B981" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Avg Salary</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{rec.average_salary}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} color="#4F46E5" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Growth Rate</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{rec.growth_rate}</div>
                  </div>
                </div>
              </div>

              {/* Matching Skills */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} /> Matching Strengths:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {matchingList.length > 0 ? matchingList.map((sk, sIdx) => (
                    <span key={sIdx} style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#065F46',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      fontWeight: 600
                    }}>
                      ✓ {sk}
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>None identified yet</span>
                  )}
                </div>
              </div>

              {/* Skill Gaps / To Improve */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Recommended Skills to Improve:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {missingItems.length > 0 ? missingItems.map((g, gIdx) => (
                    <span key={gIdx} style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#991B1B',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      fontWeight: 600
                    }}>
                      ⚠ {g.skill_name} ({g.user_score}% vs {g.target_score}%)
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>All key target skills satisfied!</span>
                  )}
                </div>
              </div>

              {/* Footer View Action */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 'auto' }}>
                <button
                  onClick={() => onSelectCareer(rec.career_id)}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <span>View Career Details</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
