import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getActionPlan, updateActionPlanProgress, regenerateActionPlan } from '../services/api';
import { 
  Target, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FolderGit2, 
  Briefcase, 
  RotateCcw, 
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckSquare,
  PlayCircle
} from 'lucide-react';

export default function ActionPlanPage({ user, onNavigate }) {
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadActionPlanData();
  }, []);

  const loadActionPlanData = async (targetCid = null) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      let plan;
      if (targetCid) {
        plan = await regenerateActionPlan(targetCid);
      } else {
        plan = await getActionPlan();
      }
      setActionPlan(plan);
    } catch (err) {
      console.error('Error loading Action Plan:', err);
      setErrorMsg('Failed to load your personalized Career Action Plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId, itemType, newStatus) => {
    try {
      setUpdatingItemId(itemId);
      const res = await updateActionPlanProgress(itemId, itemType, newStatus);
      if (res && res.action_plan) {
        setActionPlan(res.action_plan);
      }
    } catch (err) {
      console.error('Failed to update progress status:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Generating Personalized Career Action Plan & Roadmap...
        </div>
      </GlassCard>
    );
  }

  if (!actionPlan) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <AlertCircle size={32} color="#EF4444" style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172554' }}>Action Plan Not Available</h3>
        <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: 480, margin: '8px auto 20px auto' }}>
          Complete your profile, career discovery, and skill assessment to generate your personalized roadmap.
        </p>
        <button onClick={() => onNavigate('assessment')} className="btn" style={{ background: '#172554', color: '#FFFFFF', padding: '10px 20px', borderRadius: 8 }}>
          Go to Assessment →
        </button>
      </GlassCard>
    );
  }

  const {
    target_career_title,
    target_career_category,
    suitability_score,
    readiness_score,
    readiness_breakdown,
    skill_gaps,
    roadmap,
    recommended_projects,
    overall_progress_pct
  } = actionPlan;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
      {/* Header Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 27, 75, 0.94) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`glass-badge ${target_career_category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                {target_career_category} Target Pathway
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                ✓ Active Action Plan
              </span>
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Career Action Plan & Roadmap
            </h2>

            <p style={{ fontSize: '0.95rem', color: '#CBD5E1', marginTop: 8, maxWidth: 640 }}>
              Target Role: <strong style={{ color: '#FFFFFF' }}>{target_career_title}</strong>. Your personalized roadmap to bridge skill gaps and achieve job readiness.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '12px 20px',
              borderRadius: 14,
              textAlign: 'center',
              minWidth: 120
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#CBD5E1', fontWeight: 700 }}>
                Suitability
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38BDF8' }}>
                {suitability_score}%
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '12px 20px',
              borderRadius: 14,
              textAlign: 'center',
              minWidth: 120
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#CBD5E1', fontWeight: 700 }}>
                Job Readiness
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399' }}>
                {readiness_score}%
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Overall Roadmap Progress Bar */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color="#38BDF8" /> Overall Roadmap Completion Progress
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8' }}>
              {overall_progress_pct}%
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.15)', height: 12, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${overall_progress_pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38BDF8 0%, #34D399 100%)',
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </GlassCard>

      {/* SECTION 1: Career Goal Overview */}
      <GlassCard style={{ padding: '28px', borderLeft: '6px solid #4F46E5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', marginBottom: 4 }}>
              Target Career Goal
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              {target_career_title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 4 }}>
              Pathway suitability match is <strong>{suitability_score}%</strong> based on your profile, discovery & assessment scores.
            </p>
          </div>

          <button
            onClick={() => onNavigate('recommendations')}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Switch Target Career →
          </button>
        </div>
      </GlassCard>

      {/* SECTION 2: Skill Gap Analysis Matrix */}
      <GlassCard style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} color="#4F46E5" /> Skill Gap Analysis
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            {skill_gaps?.length || 0} Key Required Skills Evaluated
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Required Skill</th>
                <th style={{ padding: '12px 16px' }}>Current Level</th>
                <th style={{ padding: '12px 16px' }}>Required Target</th>
                <th style={{ padding: '12px 16px' }}>Gap %</th>
                <th style={{ padding: '12px 16px' }}>Skill Status</th>
              </tr>
            </thead>
            <tbody>
              {skill_gaps?.map((sg, idx) => {
                let badgeBg = '#ECFDF5';
                let badgeColor = '#065F46';
                let badgeBorder = '#A7F3D0';

                if (sg.status === 'Moderate') {
                  badgeBg = '#EFF6FF';
                  badgeColor = '#1E40AF';
                  badgeBorder = '#BFDBFE';
                } else if (sg.status === 'Needs Improvement') {
                  badgeBg = '#FFFBEB';
                  badgeColor = '#92400E';
                  badgeBorder = '#FDE68A';
                } else if (sg.status === 'Missing') {
                  badgeBg = '#FEF2F2';
                  badgeColor = '#991B1B';
                  badgeBorder = '#FECACA';
                }

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                      {sg.skill_name}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      {sg.current_level}%
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {sg.required_level}%
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: sg.gap > 25 ? '#DC2626' : sg.gap > 0 ? '#D97706' : '#059669' }}>
                      {sg.gap > 0 ? `+${sg.gap}%` : '0% (Met)'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        padding: '4px 12px',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        {sg.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* SECTION 3: Prioritized Learning Roadmap */}
      <GlassCard style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} color="#7C3AED" /> Prioritized Learning Roadmap
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Sequenced by skill gap severity & priority order
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {roadmap?.map((item) => {
            const isCompleted = item.status === 'Completed';
            const isInProgress = item.status === 'In Progress';
            const isUpdating = updatingItemId === item.skill_id;

            let prioBg = 'rgba(239, 68, 68, 0.12)';
            let prioColor = '#DC2626';
            if (item.priority === 'Medium') {
              prioBg = 'rgba(245, 158, 11, 0.12)';
              prioColor = '#D97706';
            } else if (item.priority === 'Low') {
              prioBg = 'rgba(16, 185, 129, 0.12)';
              prioColor = '#059669';
            }

            return (
              <div key={item.skill_id} style={{
                padding: '20px',
                borderRadius: 14,
                background: isCompleted ? 'rgba(16, 185, 129, 0.04)' : '#F8FAFC',
                border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ background: prioBg, color: prioColor, padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {item.priority} Priority
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                      ⏱ Est. Duration: {item.recommended_duration}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {item.skill_name}
                  </h4>

                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 6 }}>
                    Current: <strong>{item.current_level}%</strong> → Target: <strong>{item.target_level}%</strong> (Gap: <strong style={{ color: '#DC2626' }}>{item.gap_percentage}%</strong>)
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                    📚 Resources: {item.suggested_resources}
                  </div>
                </div>

                {/* Status Toggle Controls */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => handleStatusChange(item.skill_id, 'skill', 'Not Started')}
                    disabled={isUpdating}
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      background: item.status === 'Not Started' ? '#64748B' : 'transparent',
                      color: item.status === 'Not Started' ? '#FFFFFF' : '#64748B',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Not Started
                  </button>

                  <button
                    onClick={() => handleStatusChange(item.skill_id, 'skill', 'In Progress')}
                    disabled={isUpdating}
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      borderRadius: 8,
                      border: '1px solid #D97706',
                      background: isInProgress ? '#D97706' : 'transparent',
                      color: isInProgress ? '#FFFFFF' : '#D97706',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    In Progress
                  </button>

                  <button
                    onClick={() => handleStatusChange(item.skill_id, 'skill', 'Completed')}
                    disabled={isUpdating}
                    className="btn"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      borderRadius: 8,
                      border: '1px solid #059669',
                      background: isCompleted ? '#059669' : 'transparent',
                      color: isCompleted ? '#FFFFFF' : '#059669',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={14} /> Completed
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* SECTION 4: Recommended Portfolio Projects Roadmap */}
      <GlassCard style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderGit2 size={20} color="#10B981" /> Recommended Portfolio Projects Roadmap
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {recommended_projects?.map((proj) => {
            const isCompleted = proj.status === 'Completed';
            const isInProgress = proj.status === 'In Progress';
            const isUpdating = updatingItemId === proj.project_id;

            return (
              <div key={proj.project_id} style={{
                padding: '20px',
                borderRadius: 14,
                background: isCompleted ? 'rgba(16, 185, 129, 0.04)' : '#FFFFFF',
                border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                      {proj.title}
                    </h4>
                    <span className="glass-badge badge-it">{proj.difficulty}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '6px 0 10px 0' }}>
                    {proj.description}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: '#4F46E5', background: 'rgba(79, 70, 229, 0.06)', padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>
                    💡 <strong>Reason:</strong> {proj.reason}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {proj.skills_covered?.map((sk, sIdx) => (
                      <span key={sIdx} style={{ background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isCompleted ? '#059669' : isInProgress ? '#D97706' : '#64748B' }}>
                    {proj.status}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleStatusChange(proj.project_id, 'project', 'In Progress')}
                      disabled={isUpdating}
                      className="btn"
                      style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6, border: '1px solid #D97706', background: isInProgress ? '#D97706' : 'transparent', color: isInProgress ? '#FFF' : '#D97706', fontWeight: 700 }}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange(proj.project_id, 'project', 'Completed')}
                      disabled={isUpdating}
                      className="btn"
                      style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6, border: '1px solid #059669', background: isCompleted ? '#059669' : 'transparent', color: isCompleted ? '#FFF' : '#059669', fontWeight: 800 }}
                    >
                      ✓ Completed
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* SECTION 5: Job Readiness Analysis Matrix */}
      <GlassCard style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={20} color="#4F46E5" /> Job Readiness Breakdown Matrix
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 18, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Profile Readiness</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: readiness_breakdown?.profile_ready ? '#059669' : '#D97706', margin: '8px 0' }}>
              {readiness_breakdown?.profile_ready_pct}%
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: readiness_breakdown?.profile_ready ? '#059669' : '#D97706' }}>
              {readiness_breakdown?.profile_ready ? '✓ Profile Ready' : '⚠ Action Required'}
            </span>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 18, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Skills Readiness</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: readiness_breakdown?.skills_ready ? '#059669' : '#D97706', margin: '8px 0' }}>
              {readiness_breakdown?.skills_ready_pct}%
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: readiness_breakdown?.skills_ready ? '#059669' : '#D97706' }}>
              {readiness_breakdown?.skills_ready ? '✓ Skills Ready' : '⚠ Skill Gaps Pending'}
            </span>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 18, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Portfolio Readiness</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: readiness_breakdown?.portfolio_ready ? '#059669' : '#D97706', margin: '8px 0' }}>
              {readiness_breakdown?.portfolio_ready_pct}%
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: readiness_breakdown?.portfolio_ready ? '#059669' : '#D97706' }}>
              {readiness_breakdown?.portfolio_ready ? '✓ Portfolio Ready' : '⚠ Projects Pending'}
            </span>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 18, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Career Match</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: readiness_breakdown?.career_ready ? '#059669' : '#D97706', margin: '8px 0' }}>
              {readiness_breakdown?.career_ready_pct}%
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: readiness_breakdown?.career_ready ? '#059669' : '#D97706' }}>
              {readiness_breakdown?.career_ready ? '✓ High Career Synergy' : '⚠ Moderate Fit'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Action Footer Button */}
      <GlassCard style={{ padding: '24px', textAlign: 'center' }}>
        <button
          onClick={() => loadActionPlanData(actionPlan.target_career_id)}
          className="btn"
          style={{
            background: '#172554',
            color: '#FFFFFF',
            padding: '12px 28px',
            borderRadius: 10,
            fontSize: '0.92rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={16} /> Recalculate Roadmap & Action Plan
        </button>
      </GlassCard>
    </div>
  );
}
