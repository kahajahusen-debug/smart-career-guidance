import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getRecommendations } from '../services/api';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  ChevronRight, 
  HelpCircle,
  FolderGit2,
  Sparkles,
  Info
} from 'lucide-react';

export default function RecommendationsPage({ assessmentResult, activeCategory, onSelectCareer, onNavigate }) {
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [activeCategory]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await getRecommendations(activeCategory || 'all');
      setRecommendationsData(res);
    } catch (err) {
      console.log('Error loading dynamic recommendations:', err);
      // Fallback to prop assessmentResult if available
      if (assessmentResult && assessmentResult.career_recommendations) {
        setRecommendationsData({
          recommendations: assessmentResult.career_recommendations,
          assessment_score: assessmentResult.assessment_score || 75.0,
          data_completeness: 'Complete',
          message: 'Personalized recommendations from assessment matrix.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Calculating Personalized Career Suitability Scores...
        </div>
      </GlassCard>
    );
  }

  const recs = recommendationsData?.recommendations || assessmentResult?.career_recommendations || [];
  const isIncomplete = recommendationsData?.data_completeness === 'Incomplete';

  const filteredRecs = recs.filter((rec) => {
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
                Phase 5 Recommendation Engine
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              Your Personalized Career Recommendations
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#E2E8F0', marginTop: 6, maxWidth: 650 }}>
              Calculated dynamically using Skill Match (35%), Career Discovery (25%), Skill Assessment (20%), Education (10%), and Work-style preferences (10%).
            </p>
          </div>

          {recommendationsData?.assessment_score !== undefined && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '12px 20px',
              borderRadius: 12,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#E2E8F0', display: 'block' }}>Assessment Score</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{recommendationsData.assessment_score}%</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Notice Banner for Incomplete Data */}
      {isIncomplete && (
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
            <Info size={24} color="#D97706" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                Enhance Your Recommendation Accuracy
              </div>
              <div style={{ fontSize: '0.85rem', color: '#B45309' }}>
                {recommendationsData.message || "Complete your Profile, Career Discovery, and Skill Assessment to receive fully accurate personalized career recommendations."}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onNavigate('careerDiscovery')}
              className="btn"
              style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#D97706', border: '1px solid #D97706', padding: '6px 14px', fontSize: '0.82rem', borderRadius: 8 }}
            >
              Career Discovery
            </button>
            <button
              onClick={() => onNavigate('assessment')}
              className="btn"
              style={{ background: '#D97706', color: '#FFFFFF', padding: '6px 14px', fontSize: '0.82rem', borderRadius: 8, fontWeight: 700 }}
            >
              Skill Assessment →
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Cards List */}
      {!filteredRecs.length ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
          <HelpCircle size={32} color="#D97706" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554' }}>No Recommendations Available</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B' }}>Try selecting 'All' categories or completing your profile setup.</p>
        </GlassCard>
      ) : (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {filteredRecs.map((rec) => {
            const matchingList = rec.matching_skills || [];
            const missingList = rec.missing_skills || rec.skill_gaps?.filter((g) => g.status === 'Improve').map(g => g.skill_name) || [];

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
                    minWidth: 85
                  }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#C7D2FE', fontWeight: 700 }}>
                      Suitability
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                      {rec.suitability_score}%
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>
                  {rec.description}
                </p>

                {/* Why this matches you */}
                {rec.reason && (
                  <div style={{ background: 'rgba(79, 70, 229, 0.06)', borderLeft: '3px solid #4F46E5', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: '0.82rem' }}>
                    <strong style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Sparkles size={14} /> Why this matches you:
                    </strong>
                    <span style={{ color: '#334155' }}>{rec.reason}</span>
                  </div>
                )}

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
                    <CheckCircle2 size={14} /> Matching Skills:
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

                {/* Skills to Improve / Missing */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} /> Skills You Need to Improve:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {missingList.length > 0 ? missingList.map((ms, gIdx) => (
                      <span key={gIdx} style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#991B1B',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 600
                      }}>
                        • {typeof ms === 'string' ? ms : ms.skill_name}
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>All key skills satisfied!</span>
                    )}
                  </div>
                </div>

                {/* Recommended Projects preview */}
                {rec.recommended_projects?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F46E5', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FolderGit2 size={14} /> Recommended Portfolio Projects:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {rec.recommended_projects.map((p, pIdx) => (
                        <div key={pIdx} style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                          • {p.title || p.project_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer View & Roadmap Actions */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 'auto', display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => onSelectCareer(rec.career_id)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '9px 12px', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => onNavigate('actionPlan')}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
                      color: '#FFFFFF',
                      padding: '9px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <span>Build My Career Roadmap →</span>
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
