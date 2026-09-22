import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { 
  fetchCareers, 
  fetchQuestions, 
  fetchSampleJobs, 
  fetchPortfolioProjects,
  checkHealth
} from '../services/api';
import { 
  Briefcase, 
  BookOpen, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  FolderGit2, 
  HelpCircle,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function HomePage({ activeCategory }) {
  const [healthData, setHealthData] = useState(null);
  const [careers, setCareers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [activeTab, setActiveTab] = useState('careers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeCategory, selectedDifficulty]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hRes, cRes, qRes, jRes, pRes] = await Promise.all([
        checkHealth().catch(() => null),
        fetchCareers(activeCategory).catch(() => ({ careers: [] })),
        fetchQuestions(activeCategory, selectedDifficulty).catch(() => ({ questions: [] })),
        fetchSampleJobs(activeCategory).catch(() => ({ jobs: [] })),
        fetchPortfolioProjects(activeCategory).catch(() => ({ projects: [] }))
      ]);

      setHealthData(hRes);
      setCareers(cRes.careers || []);
      setQuestions(qRes.questions || []);
      setJobs(jRes.jobs || []);
      setProjects(pRes.projects || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.15)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: 16,
            backdropFilter: 'blur(8px)'
          }}>
            <Sparkles size={14} color="#F59E0B" />
            <span>Phase 1 Architecture Baseline Ready</span>
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.25, marginBottom: 12 }}>
            Smart Career Guidance & Job Matching System
          </h2>

          <p style={{ fontSize: '1rem', color: '#E2E8F0', lineHeight: 1.6, marginBottom: 24 }}>
            Empowering career discovery for both **IT** (Software, ML, Cloud, Security) and **Non-IT** (Marketing, Product, Finance, HR, Healthcare) domains with adaptive skill testing and job readiness intelligence.
          </p>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 20px', borderRadius: 12 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                {healthData?.stats?.total_careers || careers.length || 10}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Career Pathways</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 20px', borderRadius: 12 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                {healthData?.stats?.total_questions || questions.length || 50}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Adaptive Questions</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px 20px', borderRadius: 12 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                {healthData?.database_status?.includes('connected') ? 'MongoDB' : 'In-Memory'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Active Storage Engine</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
        {[
          { id: 'careers', label: 'Career Profiles', icon: Briefcase, count: careers.length },
          { id: 'questions', label: 'Assessment Questions', icon: HelpCircle, count: questions.length },
          { id: 'jobs', label: 'Jobs & External Links', icon: ExternalLink, count: jobs.length },
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

      {/* TAB CONTENT 2: QUESTIONS */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Difficulty Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#172554', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={16} /> Filter by Difficulty:
            </span>
            <button
              onClick={() => setSelectedDifficulty(null)}
              className="btn"
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                borderRadius: 6,
                background: selectedDifficulty === null ? '#172554' : '#F1F5F9',
                color: selectedDifficulty === null ? '#FFFFFF' : '#475569'
              }}
            >
              All Levels (1-5)
            </button>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedDifficulty(lvl)}
                className="btn"
                style={{
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  borderRadius: 6,
                  background: selectedDifficulty === lvl ? '#7C3AED' : '#F1F5F9',
                  color: selectedDifficulty === lvl ? '#FFFFFF' : '#475569'
                }}
              >
                Level {lvl}
              </button>
            ))}
          </div>

          <div className="grid-2">
            {questions.map((q) => (
              <GlassCard key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(124, 58, 237, 0.1)',
                    color: '#7C3AED',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {q.skill_name}
                  </span>
                  <span style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Difficulty Level {q.difficulty}/5
                  </span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  {q.question_text}
                </h4>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.options?.map((opt, oIdx) => (
                    <div key={oIdx} style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      background: oIdx === q.correct_option_index ? 'rgba(16, 185, 129, 0.1)' : '#F8FAFC',
                      border: oIdx === q.correct_option_index ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0',
                      color: oIdx === q.correct_option_index ? '#065F46' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: oIdx === q.correct_option_index ? 600 : 400
                    }}>
                      <span>{opt}</span>
                      {oIdx === q.correct_option_index && (
                        <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>Correct</span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>
                  Note: {q.explanation}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: JOBS */}
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

      {/* TAB CONTENT 4: PROJECTS */}
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
