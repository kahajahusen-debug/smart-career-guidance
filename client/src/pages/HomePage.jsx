import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { 
  fetchCareers, 
  fetchSampleJobs, 
  fetchPortfolioProjects
} from '../services/api';
import { 
  Briefcase, 
  ExternalLink, 
  FolderGit2, 
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function HomePage({ activeCategory, initialTab = 'careers', onNavigate, user }) {
  const [careers, setCareers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab === 'questions' ? 'careers' : initialTab);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (initialTab && initialTab !== 'questions') {
      setActiveTab(initialTab);
    } else if (initialTab === 'questions') {
      setActiveTab('careers');
    }
  }, [initialTab]);

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, jRes, pRes] = await Promise.all([
        fetchCareers(activeCategory).catch(() => ({ careers: [] })),
        fetchSampleJobs(activeCategory).catch(() => ({ jobs: [] })),
        fetchPortfolioProjects(activeCategory).catch(() => ({ projects: [] }))
      ]);

      setCareers(cRes.careers || []);
      setJobs(jRes.jobs || []);
      setProjects(pRes.projects || []);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Hero Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        padding: '36px'
      }}>
        <div style={{ maxWidth: 750, position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.25, marginBottom: 12 }}>
            Smart Career Guidance & Job Recommendations
          </h2>

          <p style={{ fontSize: '1rem', color: '#E2E8F0', lineHeight: 1.6, marginBottom: 20 }}>
            Discover and explore both <strong>IT</strong> (Software Engineering, Data Science, Cloud/DevOps, UI/UX, Security) and <strong>Non-IT</strong> (Marketing, Product, Finance, HR, Healthcare) career pathways, skill assessment benchmarks, and curated job opportunities.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {user ? (
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="btn"
                style={{ background: '#FFFFFF', color: '#172554', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem' }}
              >
                Go to My Dashboard →
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate && onNavigate('signup')}
                  className="btn"
                  style={{ background: '#FFFFFF', color: '#172554', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem' }}
                >
                  Create Account & Get Guidance →
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('login')}
                  className="btn"
                  style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem' }}
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'careers', label: 'Career Profiles', icon: Briefcase, count: careers.length },
          { id: 'jobs', label: 'Jobs & Opportunities', icon: ExternalLink, count: jobs.length },
          { id: 'projects', label: 'Portfolio Projects', icon: FolderGit2, count: projects.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                background: isSelected ? '#172554' : 'rgba(255, 255, 255, 0.8)',
                color: isSelected ? '#FFFFFF' : '#64748B',
                border: isSelected ? 'none' : '1px solid #E2E8F0',
                padding: '10px 18px',
                borderRadius: 10,
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: '0.75rem'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: CAREERS */}
      {activeTab === 'careers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#172554' }}>
              Career Profiles ({careers.length})
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Showing {activeCategory === 'all' ? 'IT & Non-IT' : activeCategory} Profiles
            </span>
          </div>

          <div className="grid-2">
            {careers.map((career) => (
              <GlassCard key={career.id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172554' }}>
                      {career.title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {career.entry_requirements}
                    </span>
                  </div>
                  <span className={`glass-badge ${career.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                    {career.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  {career.description}
                </p>

                {/* Salary & Growth */}
                <div style={{ display: 'flex', gap: 16, background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={16} color="#10B981" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Avg Salary</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{career.average_salary}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={16} color="#4F46E5" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Growth</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{career.growth_rate}</div>
                    </div>
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                    Core Required Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {career.required_skills?.map((sk, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(79, 70, 229, 0.08)',
                        color: '#4F46E5',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        {sk.skill_name} ({sk.target_score}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Roles */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Common Roles: {career.common_roles?.join(', ')}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: JOBS */}
      {activeTab === 'jobs' && (
        <div className="grid-2">
          {jobs.map((j) => (
            <GlassCard key={j.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172554' }}>{j.title}</h4>
                  <span style={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600 }}>{j.company}</span>
                </div>
                <span className={`glass-badge ${j.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                  {j.category}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: '#64748B' }}>
                <span>📍 {j.location}</span>
                <span>💼 {j.experience_level}</span>
                <span>💰 {j.salary_range}</span>
              </div>

              {/* External Job Platform Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {j.search_queries?.linkedin && (
                  <a
                    href={j.search_queries.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ flex: 1, textDecoration: 'none', padding: '8px 12px', fontSize: '0.78rem' }}
                  >
                    <span>LinkedIn</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {j.search_queries?.naukri && (
                  <a
                    href={j.search_queries.naukri}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ flex: 1, textDecoration: 'none', padding: '8px 12px', fontSize: '0.78rem' }}
                  >
                    <span>Naukri</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* TAB CONTENT 3: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="grid-2">
          {projects.map((p) => (
            <GlassCard key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554' }}>{p.title}</h4>
                <span className="glass-badge badge-it">{p.difficulty}</span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#334155' }}>{p.description}</p>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
                  Skills Covered:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.skills_covered?.map((sk, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(124, 58, 237, 0.08)',
                      color: '#7C3AED',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
