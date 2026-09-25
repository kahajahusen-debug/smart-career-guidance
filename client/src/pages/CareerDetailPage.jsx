import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchCareerById, fetchPortfolioProjects, fetchSampleJobs } from '../services/api';
import { 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  FolderGit2, 
  ExternalLink 
} from 'lucide-react';

export default function CareerDetailPage({ careerId, assessmentResult, onBack, onNavigate }) {
  const [career, setCareer] = useState(null);
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
      const [cData, pData, jData] = await Promise.all([
        fetchCareerById(careerId).catch(() => null),
        fetchPortfolioProjects('all').catch(() => ({ projects: [] })),
        fetchSampleJobs('all').catch(() => ({ jobs: [] }))
      ]);

      setCareer(cData);
      setProjects(pData?.projects || []);
      setJobs(jData?.jobs || []);
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

  if (!career) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#EF4444', fontWeight: 600, marginBottom: 16 }}>Career Profile Not Found</div>
        <button onClick={onBack} className="btn btn-outline" style={{ padding: '8px 16px' }}>
          ← Back to Recommendations
        </button>
      </GlassCard>
    );
  }

  // Find recommendation result item if available
  const recItem = assessmentResult?.career_recommendations?.find((r) => r.career_id === careerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back Header */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: 12 }}
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
              <span className={`glass-badge ${career.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                {career.category} Career Pathway
              </span>
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              {career.title}
            </h2>

            <p style={{ fontSize: '0.95rem', color: '#E2E8F0', marginTop: 10, maxWidth: 720, lineHeight: 1.6 }}>
              {career.description}
            </p>
          </div>

          {recItem && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: 16,
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#C7D2FE', fontWeight: 700 }}>
                Calculated Suitability
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                {recItem.suitability_score}%
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary Strip */}
        <div style={{ display: 'flex', gap: 24, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="#34D399" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Average Salary</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{career.average_salary}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#818CF8" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Industry Growth</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{career.growth_rate}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color="#FBBF24" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>Entry Requirements</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{career.entry_requirements}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Skill Gap Analysis Section */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={20} color="#4F46E5" /> Detailed Skill Gap Analysis
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            career.required_skills?.map((sk, sIdx) => (
              <div key={sIdx} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#172554' }}>{sk.skill_name}</span>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Benchmark Target: {sk.target_score}%</span>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Common Roles & Career Path */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', marginBottom: 12 }}>
          Common Industry Roles & Designations
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {career.common_roles?.map((role, rIdx) => (
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

      {/* Recommended Portfolio Projects */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderGit2 size={20} color="#10B981" /> Recommended Portfolio Projects for This Career
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {projects.slice(0, 2).map((p) => (
            <div key={p.id} style={{ border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#172554' }}>{p.title}</span>
                <span className="glass-badge badge-it">{p.difficulty}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#334155', marginBottom: 10 }}>{p.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {p.skills_covered?.map((sk, idx) => (
                  <span key={idx} style={{ background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem' }}>
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Related Job Listings */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExternalLink size={20} color="#4F46E5" /> Related Open Job Listings
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
    </div>
  );
}
