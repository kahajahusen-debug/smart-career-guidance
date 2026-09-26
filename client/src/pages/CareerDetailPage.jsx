import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchCareerById, fetchPortfolioProjects, fetchSampleJobs, getPersonalizedCareerDetail } from '../services/api';
import { 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  FolderGit2, 
  ExternalLink,
  Sparkles,
  Bot
} from 'lucide-react';

export default function CareerDetailPage({ careerId, assessmentResult, onBack, onNavigate }) {
  const [career, setCareer] = useState(null);
  const [recDetail, setRecDetail] = useState(null);
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (careerId) {
      loadCareerDetail();
    }
  }, [careerId]);

  const loadCareerDetail = async () => {
    try {
      setLoading(true);
      const [cData, pData, jData, recData] = await Promise.all([
        fetchCareerById(careerId).catch(() => null),
        fetchPortfolioProjects('all').catch(() => ({ projects: [] })),
        fetchSampleJobs('all').catch(() => ({ jobs: [] })),
        getPersonalizedCareerDetail(careerId).catch(() => null)
      ]);

      setCareer(cData);
      setProjects(pData?.projects || []);
      setJobs(jData?.jobs || []);
      if (recData) {
        setRecDetail(recData);
      }
    } catch (err) {
      console.error('Error loading career details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#64748B', fontWeight: 600 }}>Loading detailed career information...</div>
      </GlassCard>
    );
  }

  if (!career && !recDetail) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#EF4444', fontWeight: 600, marginBottom: 16 }}>Career Profile Not Found</div>
        <button onClick={onBack} className="btn btn-outline" style={{ padding: '8px 16px' }}>
          ← Back to Recommendations
        </button>
      </GlassCard>
    );
  }

  const activeCareer = career || recDetail;
  const recItem = recDetail || assessmentResult?.career_recommendations?.find((r) => r.career_id === careerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back Header */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> Back to Recommendations
        </button>
      </div>

      {/* Main Career Overview Header */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`glass-badge ${activeCareer.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                {activeCareer.category} Career Pathway
              </span>
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              {activeCareer.title}
            </h2>

            <p style={{ fontSize: '0.95rem', color: '#E2E8F0', marginTop: 10, maxWidth: 720, lineHeight: 1.6 }}>
              {activeCareer.description}
            </p>
          </div>

          {recItem?.suitability_score !== undefined && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: 16,
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              minWidth: 140
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#C7D2FE', fontWeight: 700 }}>
                Personalized Suitability
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                {recItem.suitability_score}%
              </div>
            </div>
          )}
        </div>

        {/* Why this career matches you */}
        {recItem?.reason && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: '#FCD34D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={16} /> Why this career matches you:
            </div>
            <p style={{ fontSize: '0.9rem', color: '#E2E8F0', margin: 0 }}>
              {recItem.reason}
            </p>
          </div>
        )}

        {/* Prepare for this Career (Phase 9 Integration) */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#FCD34D" /> Prepare for this Career:
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onNavigate('assistant', { prompt: `What specific skills and portfolio projects should I focus on to become a successful ${activeCareer.title}?` })}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Bot size={15} /> Ask AI Assistant
            </button>
            <button
              onClick={() => onNavigate('interview', { career: activeCareer.title })}
              className="btn"
              style={{
                background: '#FFFFFF',
                color: '#172554',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 800,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Briefcase size={15} /> Practice Interview
            </button>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="#34D399" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Average Salary</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{activeCareer.average_salary}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#818CF8" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Industry Growth</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{activeCareer.growth_rate}</div>
            </div>
          </div>

          {activeCareer.entry_requirements && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} color="#FBBF24" />
              <div>
                <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Entry Requirements</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{activeCareer.entry_requirements}</div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Matching Skills & Skills to Improve Split Row */}
      {recItem && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <GlassCard style={{ padding: '24px', borderTop: '4px solid #10B981' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} /> Your Matching Skills
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recItem.matching_skills?.length > 0 ? (
                recItem.matching_skills.map((sk, idx) => (
                  <span key={idx} style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700 }}>
                    ✓ {sk}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>None identified yet. Update your profile skills!</span>
              )}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '24px', borderTop: '4px solid #EF4444' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#B91C1C', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} /> Skills You Need to Improve
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(recItem.missing_skills || recItem.skill_gaps?.filter(g => g.status === 'Improve').map(g => g.skill_name))?.length > 0 ? (
                (recItem.missing_skills || recItem.skill_gaps?.filter(g => g.status === 'Improve').map(g => g.skill_name)).map((ms, idx) => (
                  <span key={idx} style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700 }}>
                    • {typeof ms === 'string' ? ms : ms.skill_name}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>Great job! All required skills satisfied.</span>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Detailed Required Skills Breakdown */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={20} color="#4F46E5" /> Required Skill Benchmarks
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recItem?.skill_gaps ? (
            recItem.skill_gaps.map((sg, idx) => {
              const isStrong = sg.status === 'Strong';
              const isGood = sg.status === 'Good';
              const isImprove = sg.status === 'Improve';

              return (
                <div key={idx} style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: isImprove ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                  border: isImprove ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                      {sg.skill_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                      Your Score: <strong>{sg.user_score}%</strong> | Required Benchmark Target: <strong>{sg.target_score}%</strong>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: isStrong ? '#D1FAE5' : isGood ? '#DBEAFE' : '#FEE2E2',
                    color: isStrong ? '#065F46' : isGood ? '#1E40AF' : '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {isImprove ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                    {sg.status === 'Improve' ? '⚠ Recommended to Improve' : `✓ ${sg.status}`}
                  </span>
                </div>
              );
            })
          ) : (
            activeCareer.required_skills?.map((sk, sIdx) => (
              <div key={sIdx} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#172554' }}>{sk.skill_name}</span>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Benchmark Target: {sk.target_score}%</span>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Common Roles & Designations */}
      {activeCareer.common_roles?.length > 0 && (
        <GlassCard style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', marginBottom: 12 }}>
            Common Industry Roles & Designations
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {activeCareer.common_roles.map((role, rIdx) => (
              <span key={rIdx} style={{
                background: 'rgba(79, 70, 229, 0.08)',
                color: '#4F46E5',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                💼 {role}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Recommended Portfolio Projects */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderGit2 size={20} color="#10B981" /> Recommended Portfolio Projects for This Pathway
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {(recItem?.recommended_projects || projects.slice(0, 2)).map((p, pIdx) => (
            <div key={pIdx} style={{ border: '1px solid #E2E8F0', padding: 18, borderRadius: 12, background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#172554' }}>{p.title || p.project_name}</span>
                  <span className="glass-badge badge-it">{p.difficulty || 'Intermediate'}</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#334155', marginBottom: 10, lineHeight: 1.4 }}>{p.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {p.skills_covered?.map((sk, idx) => (
                    <span key={idx} style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, marginTop: 6 }}>
                <button
                  onClick={() => onNavigate ? onNavigate('projects') : null}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '7px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  View Project →
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Related Job Listings */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExternalLink size={20} color="#4F46E5" /> Related Open Job Opportunities
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {jobs.slice(0, 2).map((j) => (
            <div key={j.id} style={{ border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, background: '#FFFFFF' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#172554' }}>{j.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#4F46E5', fontWeight: 600 }}>{j.company}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', margin: '6px 0' }}>📍 {j.location} | 💰 {j.salary_range}</div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {j.search_queries?.linkedin && (
                  <a href={j.search_queries.linkedin} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                    LinkedIn <ExternalLink size={12} />
                  </a>
                )}
                {j.search_queries?.naukri && (
                  <a href={j.search_queries.naukri} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                    Naukri <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Action Plan CTA Banner */}
      <GlassCard style={{
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.9) 100%)',
        borderLeft: '6px solid #4F46E5',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: 0 }}>
            Ready to master {activeCareer.title}?
          </h4>
          <p style={{ fontSize: '0.88rem', color: '#334155', margin: '4px 0 0 0' }}>
            Generate your step-by-step learning roadmap, skill gap analysis, recommended projects, and job readiness score.
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
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Build Career Action Plan →
        </button>
      </GlassCard>
    </div>
  );
}
