import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getRecommendedProjects, startProject, completeProject } from '../services/api';
import { 
  FolderGit2, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Sparkles, 
  PlayCircle, 
  CheckSquare, 
  ChevronRight,
  Filter,
  HelpCircle,
  X,
  TrendingUp,
  Award,
  Zap,
  Briefcase,
  ArrowUpDown,
  RotateCcw,
  Star
} from 'lucide-react';

export default function ProjectsPage({ activeCategory, assessmentResult, onSelectProject, onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [categoryFilter, setCategoryFilter] = useState(activeCategory || 'all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Best Match');
  
  // UX State
  const [showAll, setShowAll] = useState(false);
  const [selectedCalculationProj, setSelectedCalculationProj] = useState(null);
  const [targetCareer, setTargetCareer] = useState('Full Stack Software Engineer');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadRecommendedProjects();
  }, [categoryFilter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCalculationProj(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadRecommendedProjects = async () => {
    try {
      setLoading(true);
      const res = await getRecommendedProjects(categoryFilter);
      const projList = res.projects || [];
      setProjects(projList);
      if (res.summary) {
        setSummaryData(res.summary);
      }

      if (projList.length > 0 && projList[0].reason) {
        const reasonStr = projList[0].reason;
        if (reasonStr.includes('goal')) {
          const match = reasonStr.match(/for ([^.]+) goal/);
          if (match && match[1]) setTargetCareer(match[1]);
        }
      }
    } catch (err) {
      console.error('Error loading personalized projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async (projId) => {
    try {
      setUpdatingId(projId);
      const res = await startProject(projId);
      if (res) {
        setProjects(prev => prev.map(p => {
          if (p.id === projId || p.project_id === projId) {
            return { ...p, status: 'In Progress', progress_percentage: 0 };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error starting project:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const parseDurationWeeks = (durationStr) => {
    if (!durationStr) return 4;
    const match = durationStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 4;
  };

  // 1. Multi-attribute Filter combination (Requirement 10)
  const filteredProjects = projects.filter(p => {
    if (difficultyFilter !== 'all' && p.difficulty?.toLowerCase() !== difficultyFilter.toLowerCase()) {
      return false;
    }
    if (priorityFilter !== 'all' && p.priority?.toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // 2. Sorting logic (Requirement 9)
  const priorityOrder = { 'High Priority': 1, 'Recommended': 2, 'Explore': 3 };
  const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'Highest Priority') {
      const pA = priorityOrder[a.priority] || 4;
      const pB = priorityOrder[b.priority] || 4;
      if (pA !== pB) return pA - pB;
      return (b.recommendation_score || 0) - (a.recommendation_score || 0);
    } else if (sortBy === 'Shortest Duration') {
      return parseDurationWeeks(a.estimated_duration) - parseDurationWeeks(b.estimated_duration);
    } else if (sortBy === 'Beginner First') {
      const dA = difficultyOrder[a.difficulty] || 2;
      const dB = difficultyOrder[b.difficulty] || 2;
      return dA - dB;
    } else if (sortBy === 'Advanced First') {
      const dA = difficultyOrder[a.difficulty] || 2;
      const dB = difficultyOrder[b.difficulty] || 2;
      return dB - dA;
    } else {
      // Default: Best Match (recommendation_score descending)
      return (b.recommendation_score || 0) - (a.recommendation_score || 0);
    }
  });

  // 3. Show More pagination (Requirement 5)
  const displayedProjects = showAll ? sortedProjects : sortedProjects.slice(0, 6);

  // Summary Metrics calculation (Requirement 5)
  const inProgressCount = summaryData ? summaryData.in_progress_count : projects.filter(p => p.status === 'In Progress').length;
  const completedCount = summaryData ? summaryData.completed_count : projects.filter(p => p.status === 'Completed').length;
  const totalMatching = summaryData ? summaryData.recommended_count : projects.length;
  const readinessPct = summaryData ? summaryData.portfolio_readiness : (projects.length ? Math.round((completedCount / projects.length) * 100) : 0);

  const resetFilters = () => {
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setPriorityFilter('all');
    setSortBy('Best Match');
  };

  const getPriorityStyle = (p) => {
    if (p === 'High Priority') {
      return { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', label: 'HIGH PRIORITY' };
    }
    if (p === 'Recommended') {
      return { bg: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', label: 'RECOMMENDED' };
    }
    return { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', label: 'EXPLORE' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FolderGit2 size={20} color="#34D399" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase' }}>
              Portfolio Projects & Skill Tracking
            </span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
            Portfolio Projects
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#E2E8F0', marginTop: 8, lineHeight: 1.5 }}>
            Discover and build practical portfolio projects tailored to your target career and skill gaps.
          </p>

          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.15)', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#FBBF24" />
            <span>Target Career: <strong style={{ color: '#FFFFFF' }}>{targetCareer}</strong></span>
          </div>
        </div>
      </GlassCard>

      {/* Portfolio Summary Section (Requirement 5 & 6) */}
      <GlassCard style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={18} color="#4F46E5" /> Portfolio Summary
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Matching Projects</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', marginTop: 4 }}>
              {totalMatching}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>In Progress</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
              {inProgressCount}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
              {completedCount}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Portfolio Readiness</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4F46E5' }}>{readinessPct}%</div>
            </div>
            
            <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
              <div style={{
                width: `${readinessPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
                borderRadius: 999,
                transition: 'width 0.4s ease'
              }} />
            </div>

            {/* Requirement 6: Dynamic Portfolio Readiness Explanation */}
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 8, lineHeight: 1.35 }}>
              {readinessPct === 0 
                ? 'Complete relevant portfolio projects to increase your readiness.' 
                : 'Portfolio readiness is based on completed projects relevant to your target career.'}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Filter & Controls Bar */}
      <GlassCard style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={18} color="#4F46E5" />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#172554' }}>Filter & Sort Projects</span>
          </div>

          {(categoryFilter !== 'all' || difficultyFilter !== 'all' || priorityFilter !== 'all' || sortBy !== 'Best Match') && (
            <button
              onClick={resetFilters}
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {/* Category Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Category:
            </label>
            <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
              {['all', 'IT', 'Non-IT'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: 'none',
                    background: categoryFilter === cat ? '#172554' : 'transparent',
                    color: categoryFilter === cat ? '#FFFFFF' : '#475569',
                    fontWeight: categoryFilter === cat ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Difficulty:
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#172554',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#172554',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Priorities</option>
              <option value="High Priority">High Priority</option>
              <option value="Recommended">Recommended</option>
              <option value="Explore">Explore</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: '#FFFFFF',
                color: '#4F46E5',
                cursor: 'pointer'
              }}
            >
              <option value="Best Match">Best Match</option>
              <option value="Highest Priority">Highest Priority</option>
              <option value="Shortest Duration">Shortest Duration</option>
              <option value="Beginner First">Beginner First</option>
              <option value="Advanced First">Advanced First</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Recommended Projects Cards List */}
      {loading ? (
        <GlassCard style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.05rem' }}>
            Calculating personalized portfolio recommendations...
          </div>
        </GlassCard>
      ) : sortedProjects.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          {projects.length === 0 ? (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: '0 0 8px 0' }}>
                No personalized project recommendations available yet.
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: 500, margin: '0 auto 18px auto' }}>
                Complete Career Discovery and Skill Assessment to generate customized portfolio project recommendations.
              </p>
              <button
                onClick={() => onNavigate ? onNavigate('assessment') : null}
                className="btn btn-primary"
                style={{ padding: '9px 20px', fontSize: '0.85rem' }}
              >
                Start Skill Assessment →
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: '0 0 8px 0' }}>
                No projects match your current filters.
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '0 0 16px 0' }}>
                Try adjusting or resetting your category, difficulty, or priority filter selections.
              </p>
              <button
                onClick={resetFilters}
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </GlassCard>
      ) : (
        <>
          {/* Pagination Subtitle (Requirement 5) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            <span>
              Showing <strong>{displayedProjects.length}</strong> of <strong>{sortedProjects.length}</strong> projects
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {displayedProjects.map((p, idx) => {
              const pId = p.id || p.project_id;
              const isCompleted = p.status === 'Completed';
              const isInProgress = p.status === 'In Progress';
              const isUpdating = updatingId === pId;
              const priorityInfo = getPriorityStyle(p.priority || 'Recommended');
              
              // Top Match indicator: only true for top project in best match order (Requirement 7)
              const isTopMatch = p.is_top_match || (idx === 0 && !showAll && sortBy === 'Best Match' && (p.recommendation_score || 0) >= 70);

              return (
                <GlassCard key={pId} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  border: isTopMatch ? '2px solid #34D399' : undefined
                }}>
                  {/* Top Badge & Match Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: 0, lineHeight: 1.3 }}>
                          {p.title}
                        </h3>
                      </div>

                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`glass-badge ${p.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                          {p.category}
                        </span>
                        <span className="glass-badge badge-it">
                          {p.difficulty}
                        </span>
                        <span style={{
                          background: priorityInfo.bg,
                          color: priorityInfo.color,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em'
                        }}>
                          {priorityInfo.label}
                        </span>
                        {isTopMatch && (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#047857',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}>
                            <Star size={11} color="#047857" fill="#047857" /> Top Match
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {p.estimated_duration || '4-6 weeks'}
                        </span>
                      </div>
                    </div>

                    {p.recommendation_score !== undefined && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#065F46',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          ★ {p.recommendation_score}% Match
                        </div>
                        <button
                          onClick={() => setSelectedCalculationProj(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4F46E5',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            marginTop: 4,
                            padding: 0
                          }}
                          aria-label={`View match score calculation breakdown for ${p.title}`}
                        >
                          How is this calculated?
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                    {p.description}
                  </p>

                  {/* Why this project (Requirement 8 - Personalized Rationale) */}
                  {p.reason && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#4F46E5',
                      background: 'rgba(79, 70, 229, 0.06)',
                      border: '1px solid rgba(79, 70, 229, 0.15)',
                      padding: '10px 12px',
                      borderRadius: 8,
                      lineHeight: 1.45
                    }}>
                      💡 <strong>Why this project:</strong> {p.reason}
                    </div>
                  )}

                  {/* Skills You Will Improve (Requirements 3 & 4 - Max 3 skills, real personalization) */}
                  {p.skills_you_will_improve && p.skills_you_will_improve.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                        Skills You'll Improve:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                        {p.skills_you_will_improve.slice(0, 3).map((sk, skIdx) => (
                          <div key={skIdx} style={{ fontSize: '0.76rem', color: '#172554', fontWeight: 600 }}>
                            <span style={{ color: sk.is_gap ? '#DC2626' : '#172554' }}>{sk.skill_name}</span>{' '}
                            <span style={{ color: sk.level_display?.includes('→') ? '#059669' : '#475569', fontWeight: 700 }}>
                              {sk.level_display || `${sk.current_level} → ${sk.target_level}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Covered Tags */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' }}>
                      Skills Covered:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.skills_covered?.map((sk, skIdx) => (
                        <span key={skIdx} style={{
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

                  {/* Progress Bar */}
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ color: isCompleted ? '#059669' : isInProgress ? '#D97706' : '#64748B' }}>
                        Progress: {p.status || 'Not Started'}
                      </span>
                      <span style={{ color: '#172554' }}>
                        {p.progress_percentage || (isCompleted ? 100 : (isInProgress ? 50 : 0))}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        width: `${p.progress_percentage || (isCompleted ? 100 : (isInProgress ? 50 : 0))}%`,
                        height: '100%',
                        background: isCompleted ? '#10B981' : (isInProgress ? '#F59E0B' : '#CBD5E1'),
                        borderRadius: 999
                      }} />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                    <button
                      onClick={() => onSelectProject ? onSelectProject(pId) : null}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      View Details
                    </button>

                    {isCompleted ? (
                      <button
                        disabled
                        className="btn"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          background: '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8
                        }}
                      >
                        Completed ✓
                      </button>
                    ) : isInProgress ? (
                      <button
                        onClick={() => onSelectProject ? onSelectProject(pId) : null}
                        className="btn"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          background: '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8
                        }}
                      >
                        Continue Project →
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartProject(pId)}
                        disabled={isUpdating}
                        className="btn"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          background: '#172554',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8
                        }}
                      >
                        Start Project
                      </button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Show More Projects Button */}
          {sortedProjects.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn btn-outline"
                style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700 }}
              >
                {showAll ? 'Show Fewer Projects' : `Show More Projects (${sortedProjects.length - 6} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* "How is this calculated?" Breakdown Modal */}
      {selectedCalculationProj && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: 20
        }}>
          <GlassCard style={{ maxWidth: 520, width: '100%', padding: '28px', background: '#FFFFFF', position: 'relative' }}>
            <button
              onClick={() => setSelectedCalculationProj(null)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer'
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={20} color="#4F46E5" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                How is this score calculated?
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 16px 0' }}>
              Specific match score contribution for <strong>{selectedCalculationProj.title}</strong> based on the 5-part recommendation model:
            </p>

            {selectedCalculationProj.match_score_breakdown && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>1. Target Career Relevance (35%)</span>
                  <span style={{ color: '#172554', fontWeight: 800 }}>{selectedCalculationProj.match_score_breakdown.target_career_relevance} / 35</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>2. Skill Gap Alignment (30%)</span>
                  <span style={{ color: '#172554', fontWeight: 800 }}>{selectedCalculationProj.match_score_breakdown.skill_gap_alignment} / 30</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>3. Current Skill Compatibility (15%)</span>
                  <span style={{ color: '#172554', fontWeight: 800 }}>{selectedCalculationProj.match_score_breakdown.current_skill_compatibility} / 15</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>4. Difficulty & Readiness Fit (10%)</span>
                  <span style={{ color: '#172554', fontWeight: 800 }}>{selectedCalculationProj.match_score_breakdown.difficulty_readiness_fit} / 10</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>5. Portfolio Value (10%)</span>
                  <span style={{ color: '#172554', fontWeight: 800 }}>{selectedCalculationProj.match_score_breakdown.portfolio_value_fit} / 10</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', borderTop: '2px solid #CBD5E1', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ color: '#172554', fontWeight: 800 }}>Total Match Score</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>{selectedCalculationProj.recommendation_score}%</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedCalculationProj(null)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
