import React, { useState, useEffect } from 'react';
import { fetchSampleJobs, fetchCareers } from '../services/api';
import { formatSalary } from '../utils/formatters';
import {
  ExternalLink,
  Briefcase,
  MapPin,
  IndianRupee,
  Clock,
  CheckCircle2,
  Search,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Building2
} from 'lucide-react';

export default function JobsPage({ activeCategory, assessmentResult, onSelectCareer, onNavigate }) {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'careers'
  const [jobs, setJobs] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(activeCategory || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jRes, cRes] = await Promise.all([
        fetchSampleJobs(categoryFilter).catch(() => ({ jobs: [] })),
        fetchCareers(categoryFilter).catch(() => ({ careers: [] }))
      ]);
      setJobs(jRes.jobs || []);
      setCareers(cRes.careers || []);
    } catch (err) {
      console.error('Error loading jobs & careers data:', err);
    } finally {
      setLoading(false);
    }
  };

  const topRecTitle = assessmentResult?.career_recommendations?.[0]?.title || null;

  // Filter jobs
  const filteredJobs = jobs.filter((j) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchTitle = j.title.toLowerCase().includes(q);
    const matchCompany = (j.company || '').toLowerCase().includes(q);
    const matchSkills = (j.required_skills || []).some(s => s.toLowerCase().includes(q));
    const matchLoc = (j.location || '').toLowerCase().includes(q);
    return matchTitle || matchCompany || matchSkills || matchLoc;
  });

  // Filter careers
  const filteredCareers = careers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchTitle = c.title.toLowerCase().includes(q);
    const matchDesc = (c.description || '').toLowerCase().includes(q);
    const matchSkills = (c.required_skills || []).some(s => {
      const name = typeof s === 'string' ? s : s.skill_name;
      return name.toLowerCase().includes(q);
    });
    return matchTitle || matchDesc || matchSkills;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '28px 32px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="saas-badge badge-it">
              <Briefcase size={13} /> Opportunities & Pathways
            </span>
            {topRecTitle && (
              <span className="saas-badge badge-success">
                Matched for: {topRecTitle}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Careers & Job Opportunities
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 6, margin: 0 }}>
            Explore verified career pathways and active curated job listings across IT and Non-IT domains.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div style={{
          display: 'flex',
          background: '#F1F5F9',
          padding: 4,
          borderRadius: 10,
          border: '1px solid #E2E8F0'
        }}>
          <button
            onClick={() => setActiveTab('jobs')}
            className="btn"
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'jobs' ? 700 : 500,
              background: activeTab === 'jobs' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'jobs' ? '#0F172A' : '#64748B',
              borderRadius: 8,
              boxShadow: activeTab === 'jobs' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Curated Job Openings ({filteredJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('careers')}
            className="btn"
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'careers' ? 700 : 500,
              background: activeTab === 'careers' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'careers' ? '#0F172A' : '#64748B',
              borderRadius: 8,
              boxShadow: activeTab === 'careers' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Career Pathways Catalog ({filteredCareers.length})
          </button>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder={activeTab === 'jobs' ? "Search jobs by title, company, skills, or city..." : "Search career pathways by title or domain..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 32, fontSize: '0.82rem' }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
          {['all', 'IT', 'Non-IT'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="btn"
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                borderRadius: 6,
                border: 'none',
                background: categoryFilter === cat ? '#FFFFFF' : 'transparent',
                color: categoryFilter === cat ? '#0F172A' : '#64748B',
                fontWeight: categoryFilter === cat ? 700 : 500,
                boxShadow: categoryFilter === cat ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer'
              }}
            >
              {cat === 'all' ? 'All Sectors' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          padding: '48px 20px'
        }}>
          <div style={{ color: '#64748B', fontWeight: 600 }}>Loading opportunities...</div>
        </div>
      ) : activeTab === 'jobs' ? (
        /* TAB 1: CURATED JOBS */
        filteredJobs.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            padding: '48px 24px'
          }}>
            <HelpCircle size={32} color="#D97706" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>No Matching Jobs Found</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: 420, margin: '6px auto 0' }}>
              Try adjusting your search criteria or switching the category filter.
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {filteredJobs.map((j) => (
              <div
                key={j.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                      {j.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Building2 size={14} color="#4F46E5" />
                      <span style={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 700 }}>
                        {j.company}
                      </span>
                    </div>
                  </div>

                  <span className={`saas-badge ${j.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                    {j.category}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  background: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  color: '#475569'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#64748B" />
                    <span>{j.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#64748B" />
                    <span>{j.experience_level}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: 'span 2' }}>
                    <IndianRupee size={14} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatSalary(j.salary_range)}</span>
                  </div>
                </div>

                {/* Skills Covered */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' }}>
                    Required Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {j.required_skills?.map((sk, idx) => (
                      <span key={idx} style={{
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        fontWeight: 600
                      }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* External Job Portal Direct Links */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 'auto', display: 'flex', gap: 10 }}>
                  {j.search_queries?.linkedin && (
                    <a
                      href={j.search_queries.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ flex: 1, textDecoration: 'none', padding: '7px 12px', fontSize: '0.78rem', fontWeight: 600 }}
                      title="External Link: Opens in new tab"
                    >
                      <span>LinkedIn Jobs</span>
                      <ExternalLink size={12} color="#0077B5" />
                    </a>
                  )}
                  {j.search_queries?.naukri && (
                    <a
                      href={j.search_queries.naukri}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ flex: 1, textDecoration: 'none', padding: '7px 12px', fontSize: '0.78rem', fontWeight: 600 }}
                      title="External Link: Opens in new tab"
                    >
                      <span>Naukri Portal</span>
                      <ExternalLink size={12} color="#4F46E5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB 2: CAREER PATHWAYS CATALOG */
        filteredCareers.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            padding: '48px 24px'
          }}>
            <HelpCircle size={32} color="#D97706" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>No Career Pathways Found</h3>
          </div>
        ) : (
          <div className="grid-2">
            {filteredCareers.map((c) => (
              <div
                key={c.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                      {c.title}
                    </h3>
                    <div style={{ marginTop: 4 }}>
                      <span className={`saas-badge ${c.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                        {c.category}
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {c.description}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  background: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IndianRupee size={14} color="#059669" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Avg Salary (India)</div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{formatSalary(c.average_salary)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="#4F46E5" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Growth Rate</div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.growth_rate}</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onSelectCareer && onSelectCareer(c.id)}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '8px', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    <span>View Career Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
