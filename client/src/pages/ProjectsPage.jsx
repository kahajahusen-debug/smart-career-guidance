import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchPortfolioProjects } from '../services/api';
import { FolderGit2, CheckCircle2, Layers, X, ExternalLink } from 'lucide-react';

export default function ProjectsPage({ activeCategory, assessmentResult }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, [activeCategory]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetchPortfolioProjects(activeCategory);
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Error loading portfolio projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const missingSkills = assessmentResult?.missing_skills || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FolderGit2 size={20} color="#34D399" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase' }}>
              Skill Gap Portfolio Projects
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            Recommended Portfolio Projects
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#E2E8F0', marginTop: 8 }}>
            Build real-world projects designed to bridge your identified skill gaps and demonstrate mastery to hiring managers.
          </p>
          {missingSkills.length > 0 && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} color="#FBBF24" />
              <span>Targeting Gaps: <strong>{missingSkills.join(', ')}</strong></span>
            </div>
          )}
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: '#64748B', fontWeight: 600 }}>Loading recommended portfolio projects...</div>
        </GlassCard>
      ) : (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {projects.map((p) => {
            const coversMissing = p.skills_covered?.some((sk) => missingSkills.includes(sk));
            return (
              <GlassCard key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                      {p.title}
                    </h3>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                      <span className="glass-badge badge-it">{p.difficulty} Level</span>
                      <span className={`glass-badge ${p.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>{p.category}</span>
                    </div>
                  </div>
                  {coversMissing && (
                    <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
                      ★ Skill Gap Match
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  {p.description}
                </p>

                {/* Skills Covered */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' }}>
                    Skills Covered:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {p.skills_covered?.map((sk, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(124, 58, 237, 0.08)',
                        color: '#7C3AED',
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

                {/* Action View */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 'auto' }}>
                  <button
                    onClick={() => setSelectedProject(p)}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '9px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    View Project Details
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <GlassCard style={{ maxWidth: 560, width: '100%', padding: '32px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className="glass-badge badge-it" style={{ marginBottom: 6, display: 'inline-block' }}>{selectedProject.difficulty} Project</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                  {selectedProject.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
              {selectedProject.description}
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#172554', marginBottom: 8 }}>
                Deliverables & Milestones:
              </div>
              <ul style={{ paddingLeft: 20, fontSize: '0.88rem', color: '#475569', margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedProject.deliverables?.map((d, idx) => (
                  <li key={idx}>{d}</li>
                )) || <li>GitHub Repository & Deployed Demo</li>}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <button
                onClick={() => setSelectedProject(null)}
                className="btn"
                style={{ background: '#172554', color: '#FFFFFF', padding: '8px 20px', borderRadius: 8 }}
              >
                Close Window
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
