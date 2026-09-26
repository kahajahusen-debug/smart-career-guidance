import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { 
  getProjectDetail, 
  updateProjectProgress, 
  toggleProjectMilestone, 
  startProject, 
  completeProject 
} from '../services/api';
import { 
  ArrowLeft, 
  FolderGit2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Code, 
  Layers, 
  PlayCircle, 
  CheckSquare, 
  Sliders,
  Globe,
  FileText,
  Save,
  Check,
  Zap,
  TrendingUp,
  AlertCircle,
  Package,
  Award
} from 'lucide-react';

export default function ProjectDetailPage({ projectId, onBack, onNavigate }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [customProgress, setCustomProgress] = useState(0);

  // Link inputs state
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [linksSaved, setLinksSaved] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const loadProjectData = async (pId) => {
    try {
      setLoading(true);
      const data = await getProjectDetail(pId);
      setProject(data);
      setCustomProgress(data.progress_percentage || 0);
      setGithubUrl(data.github_url || '');
      setLiveDemoUrl(data.live_demo_url || '');
      setDocumentationUrl(data.documentation_url || '');
    } catch (err) {
      console.error('Error loading project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setUpdating(true);
      const res = await startProject(projectId);
      if (res && res.progress) {
        setProject(prev => ({
          ...prev,
          status: res.progress.status,
          progress_percentage: res.progress.progress_percentage,
          started_at: res.progress.started_at
        }));
      }
    } catch (err) {
      console.error('Error starting project:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    try {
      setUpdating(true);
      const res = await completeProject(projectId);
      if (res && res.progress) {
        setProject(prev => ({
          ...prev,
          status: res.progress.status,
          progress_percentage: 100,
          completed_at: res.progress.completed_at
        }));
        setCustomProgress(100);
      }
    } catch (err) {
      console.error('Error completing project:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId) => {
    try {
      setUpdating(true);
      const res = await toggleProjectMilestone(projectId, milestoneId);
      if (res && res.progress) {
        const updatedCompleted = res.progress.completed_milestones || [];
        setProject(prev => ({
          ...prev,
          status: res.progress.status,
          progress_percentage: res.progress.progress_percentage,
          completed_milestones: updatedCompleted,
          roadmap: (prev.roadmap || []).map(m => ({
            ...m,
            completed: updatedCompleted.includes(m.id)
          }))
        }));
        setCustomProgress(res.progress.progress_percentage);
      }
    } catch (err) {
      console.error('Error toggling milestone:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveLinks = async () => {
    try {
      setUpdating(true);
      const res = await updateProjectProgress(projectId, {
        github_url: githubUrl,
        live_demo_url: liveDemoUrl,
        documentation_url: documentationUrl
      });
      if (res && res.progress) {
        setProject(prev => ({
          ...prev,
          github_url: res.progress.github_url,
          live_demo_url: res.progress.live_demo_url,
          documentation_url: res.progress.documentation_url
        }));
        setLinksSaved(true);
        setTimeout(() => setLinksSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving project links:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProgress = async (pctValue, statusStr = 'In Progress') => {
    try {
      setUpdating(true);
      const newPct = pctValue === 100 ? 100 : pctValue;
      const targetStatus = newPct === 100 ? 'Completed' : (newPct === 0 ? 'Not Started' : statusStr);
      const res = await updateProjectProgress(projectId, {
        status: targetStatus,
        progress_percentage: newPct
      });
      if (res && res.progress) {
        setProject(prev => ({
          ...prev,
          status: res.progress.status,
          progress_percentage: res.progress.progress_percentage,
          completed_at: res.progress.completed_at,
          started_at: res.progress.started_at
        }));
      }
      setShowProgressModal(false);
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Loading Project Details...
        </div>
      </GlassCard>
    );
  }

  if (!project) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172554' }}>Project Not Found</h3>
        <button onClick={onBack} className="btn btn-outline" style={{ marginTop: 16 }}>
          ← Back to Portfolio Projects
        </button>
      </GlassCard>
    );
  }

  const {
    title,
    category,
    difficulty,
    estimated_duration,
    description,
    reason,
    priority = 'Recommended',
    recommendation_score,
    match_score_breakdown,
    skills_covered,
    skills_you_will_improve,
    technologies,
    learning_outcomes,
    roadmap,
    deliverables,
    status: currentStatus,
    progress_percentage: currentProgressPct = 0
  } = project;

  const defaultRoadmap = roadmap || [
    { id: "m1", step: 1, title: "Project Setup & Architecture", completed: false },
    { id: "m2", step: 2, title: "Frontend Development", completed: false },
    { id: "m3", step: 3, title: "Backend REST API", completed: false },
    { id: "m4", step: 4, title: "Database Integration", completed: false },
    { id: "m5", step: 5, title: "Testing & User Isolation", completed: false },
    { id: "m6", step: 6, title: "Production Deployment", completed: false }
  ];

  const getPriorityStyle = (p) => {
    if (p === 'High Priority') return { bg: 'rgba(239, 68, 68, 0.15)', color: '#FFFFFF', border: 'rgba(239, 68, 68, 0.3)', label: 'HIGH PRIORITY' };
    if (p === 'Recommended') return { bg: 'rgba(79, 70, 229, 0.2)', color: '#FFFFFF', border: 'rgba(79, 70, 229, 0.4)', label: 'RECOMMENDED' };
    return { bg: 'rgba(148, 163, 184, 0.2)', color: '#FFFFFF', border: 'rgba(148, 163, 184, 0.3)', label: 'EXPLORE' };
  };

  const pStyle = getPriorityStyle(priority);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="btn btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> Back to Projects Catalog
        </button>
      </div>

      {/* 1. Project Overview Header Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.96) 0%, rgba(79, 70, 229, 0.92) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span className={`glass-badge ${category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                {category} Category
              </span>
              <span className="glass-badge badge-it">
                {difficulty} Level
              </span>
              <span style={{
                background: pStyle.bg,
                color: pStyle.color,
                border: `1px solid ${pStyle.border}`,
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                {pStyle.label}
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Clock size={14} /> Est: {estimated_duration || '4 Weeks'}
              </span>
            </div>

            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              {title}
            </h2>

            <p style={{ fontSize: '0.95rem', color: '#E2E8F0', marginTop: 10, lineHeight: 1.6 }}>
              {description}
            </p>
          </div>

          {recommendation_score && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '16px 24px',
              borderRadius: 16,
              textAlign: 'center',
              minWidth: 140
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#C7D2FE', fontWeight: 700 }}>
                Recommendation
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34D399' }}>
                {recommendation_score}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>
                Synergy Match
              </div>
            </div>
          )}
        </div>

        {/* 2. Why This Project Is Recommended */}
        {reason && (
          <div style={{
            marginTop: 20,
            padding: '12px 18px',
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: 12,
            fontSize: '0.88rem',
            color: '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Sparkles size={18} color="#FBBF24" />
            <span><strong>Why Recommended:</strong> {reason}</span>
          </div>
        )}
      </GlassCard>

      {/* 3. Match Score Breakdown Card */}
      {match_score_breakdown && (
        <GlassCard style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#F59E0B" /> Recommendation Match Breakdown (0 - 100 Score)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Target Career Relevance (35%)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4F46E5', marginTop: 4 }}>
                {match_score_breakdown.target_career_relevance} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ 35</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Skill Gap Alignment (30%)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                {match_score_breakdown.skill_gap_alignment} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ 30</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Current Compatibility (15%)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>
                {match_score_breakdown.current_skill_compatibility} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ 15</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Difficulty Fit (10%)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0EA5E9', marginTop: 4 }}>
                {match_score_breakdown.difficulty_readiness_fit} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ 10</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Portfolio Value (10%)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                {match_score_breakdown.portfolio_value_fit} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ 10</span>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 4. Skills You Will Improve Section */}
      {skills_you_will_improve && skills_you_will_improve.length > 0 && (
        <GlassCard style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#10B981" /> Skills You Will Improve
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {skills_you_will_improve.map((sk, idx) => (
              <div key={idx} style={{
                background: sk.is_gap ? 'rgba(239, 68, 68, 0.05)' : '#F8FAFC',
                border: `1px solid ${sk.is_gap ? 'rgba(239, 68, 68, 0.2)' : '#E2E8F0'}`,
                padding: '12px 14px',
                borderRadius: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#172554' }}>{sk.skill_name}</span>
                  {sk.is_gap && (
                    <span style={{ fontSize: '0.7rem', color: '#DC2626', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      Skill Gap
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Current: <strong>{sk.current_level}</strong></span>
                  <span>→</span>
                  <span style={{ color: '#059669' }}>Target: <strong>{sk.target_level}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 5. Technology Stack & Core Skills */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <GlassCard style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="#7C3AED" /> Core Skills Covered
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills_covered?.map((sk, idx) => (
              <span key={idx} style={{
                background: 'rgba(124, 58, 237, 0.08)',
                color: '#7C3AED',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                {sk}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code size={18} color="#0EA5E9" /> Technology Stack & Tools
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {technologies?.map((tech, idx) => (
              <span key={idx} style={{
                background: 'rgba(14, 165, 233, 0.08)',
                color: '#0EA5E9',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                {tech}
              </span>
            )) || <span style={{ fontSize: '0.85rem', color: '#64748B' }}>React, Python, FastAPI, MongoDB, Git</span>}
          </div>
        </GlassCard>
      </div>

      {/* 6. Learning Outcomes */}
      {learning_outcomes && learning_outcomes.length > 0 && (
        <GlassCard style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: '0 0 14px 0' }}>
            🎯 Key Learning Outcomes
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {learning_outcomes.map((outcome, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: '#F8FAFC',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #E2E8F0'
              }}>
                <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 500 }}>{outcome}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 7. Step-by-Step Project Roadmap / Milestones */}
      <GlassCard style={{ padding: '28px' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderGit2 size={20} color="#4F46E5" /> Step-by-Step Project Roadmap
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {defaultRoadmap.map((item, idx) => {
            const mId = item.id || `m${idx + 1}`;
            const mTitle = item.title || item;
            const isDone = item.completed || (project.completed_milestones || []).includes(mId) || currentStatus === 'Completed';

            return (
              <div key={mId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderRadius: 12,
                background: isDone ? 'rgba(16, 185, 129, 0.05)' : '#F8FAFC',
                border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0'
              }}>
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => handleToggleMilestone(mId)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#10B981' }}
                  aria-label={`Toggle completion for milestone ${mTitle}`}
                />

                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: isDone ? '#10B981' : '#172554',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  {item.step || idx + 1}
                </div>

                <div style={{ flex: 1, fontSize: '0.92rem', fontWeight: 700, color: isDone ? '#065F46' : '#172554', textDecoration: isDone ? 'line-through' : 'none' }}>
                  {mTitle}
                </div>

                <div>
                  <span style={{
                    background: isDone ? '#ECFDF5' : '#F1F5F9',
                    color: isDone ? '#059669' : '#64748B',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {isDone ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 8. Deliverables */}
      {deliverables && deliverables.length > 0 && (
        <GlassCard style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} color="#4F46E5" /> Required Deliverables
          </h4>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', color: '#475569' }}>
            {deliverables.map((d, idx) => (
              <li key={idx}><strong>{d}</strong></li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* 9. Progress Tracking Card */}
      <GlassCard style={{ padding: '24px', borderLeft: '6px solid #10B981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Your Project Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <span style={{
                background: currentStatus === 'Completed' ? '#ECFDF5' : (currentStatus === 'In Progress' ? '#FFFBEB' : '#F1F5F9'),
                color: currentStatus === 'Completed' ? '#065F46' : (currentStatus === 'In Progress' ? '#92400E' : '#475569'),
                border: `1px solid ${currentStatus === 'Completed' ? '#A7F3D0' : (currentStatus === 'In Progress' ? '#FDE68A' : '#CBD5E1')}`,
                padding: '4px 14px',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 800
              }}>
                {currentStatus === 'Completed' ? '✓ Completed' : currentStatus}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554' }}>
                Progress: {currentProgressPct}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {currentStatus === 'Not Started' && (
              <button
                onClick={handleStart}
                disabled={updating}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <PlayCircle size={16} /> Start Project
              </button>
            )}

            <button
              onClick={() => setShowProgressModal(true)}
              disabled={updating}
              className="btn btn-outline"
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Sliders size={16} /> Update Progress
            </button>

            {currentStatus !== 'Completed' && (
              <button
                onClick={handleComplete}
                disabled={updating}
                className="btn"
                style={{
                  background: '#059669',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <CheckSquare size={16} /> Mark as Completed
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ height: 12, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${currentProgressPct}%`,
              height: '100%',
              background: currentStatus === 'Completed' ? '#10B981' : 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </GlassCard>

      {/* 10, 11, 12. Submission URLs (GitHub, Live Demo, Documentation) */}
      <GlassCard style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderGit2 size={18} color="#172554" /> Project Submission & Repository Links
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* 10. GitHub URL */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              GitHub Repository URL:
            </label>
            <input
              type="url"
              placeholder="https://github.com/username/project"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* 11. Live Demo URL */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              Live Demo URL:
            </label>
            <input
              type="url"
              placeholder="https://myproject.vercel.app"
              value={liveDemoUrl}
              onChange={(e) => setLiveDemoUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* 12. Documentation URL */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              Documentation / PRD Link:
            </label>
            <input
              type="url"
              placeholder="https://notion.so/my-prd"
              value={documentationUrl}
              onChange={(e) => setDocumentationUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSaveLinks}
            disabled={updating}
            className="btn"
            style={{
              background: '#172554',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Save size={16} /> Save Portfolio Links
          </button>

          {linksSaved && (
            <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Check size={16} /> Links saved successfully!
            </span>
          )}
        </div>
      </GlassCard>

      {/* Update Progress Modal */}
      {showProgressModal && (
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
          <GlassCard style={{ maxWidth: 480, width: '100%', padding: '28px', background: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0' }}>
              Update Project Progress
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: 20 }}>
              Select your current progress percentage for <strong>{title}</strong>:
            </p>

            {/* Quick Percentage Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {[0, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setCustomProgress(pct)}
                  className="btn"
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.82rem',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: customProgress === pct ? '#172554' : 'transparent',
                    color: customProgress === pct ? '#FFFFFF' : '#334155',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Custom Slider */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                <span>Custom Progress:</span>
                <span style={{ color: '#4F46E5' }}>{customProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={customProgress}
                onChange={(e) => setCustomProgress(parseInt(e.target.value, 10))}
                style={{ width: '100%', cursor: 'pointer' }}
                aria-label="Progress percentage slider"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <button
                onClick={() => setShowProgressModal(false)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleSaveProgress(customProgress)}
                disabled={updating}
                className="btn"
                style={{ background: '#172554', color: '#FFFFFF', padding: '8px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700 }}
              >
                Save Progress
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
