import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchSampleJobs } from '../services/api';
import { ExternalLink, Briefcase, MapPin, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default function JobsPage({ activeCategory, assessmentResult }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, [activeCategory]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetchSampleJobs(activeCategory);
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Error loading sample jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const topRecTitle = assessmentResult?.career_recommendations?.[0]?.title || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Briefcase size={20} color="#60A5FA" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
              Personalized Opportunities
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            Curated Job & Career Opportunities
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#E2E8F0', marginTop: 8 }}>
            Discover openings across IT and Non-IT sectors matched with your profile skills and recommended pathway.
          </p>
          {topRecTitle && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} color="#34D399" />
              <span>Tailored for: <strong>{topRecTitle}</strong></span>
            </div>
          )}
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: '#64748B', fontWeight: 600 }}>Loading job listings...</div>
        </GlassCard>
      ) : (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {jobs.map((j) => (
            <GlassCard key={j.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    {j.title}
                  </h3>
                  <span style={{ fontSize: '0.88rem', color: '#4F46E5', fontWeight: 700 }}>
                    {j.company}
                  </span>
                </div>
                <span className={`glass-badge ${j.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                  {j.category}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 10, fontSize: '0.82rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#64748B" />
                  <span>{j.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#64748B" />
                  <span>{j.experience_level}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: 'span 2' }}>
                  <DollarSign size={14} color="#10B981" />
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{j.salary_range}</span>
                </div>
              </div>

              {/* Skills Covered */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' }}>
                  Required Skills:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {j.required_skills?.map((sk, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(79, 70, 229, 0.08)',
                      color: '#4F46E5',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
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
                    style={{ flex: 1, textDecoration: 'none', padding: '8px 12px', fontSize: '0.78rem' }}
                  >
                    <span>LinkedIn Jobs</span>
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
                    <span>Naukri Portal</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
