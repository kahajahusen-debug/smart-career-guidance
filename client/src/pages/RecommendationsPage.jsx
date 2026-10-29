import React, { useState, useEffect } from 'react';
import { getRecommendations, regenerateActionPlan } from '../services/api';
import { formatSalary } from '../utils/formatters';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  IndianRupee, 
  TrendingUp, 
  ChevronRight, 
  HelpCircle,
  FolderGit2,
  Sparkles,
  Info,
  Search,
  ArrowUpDown,
  Target,
  Check
} from 'lucide-react';

export default function RecommendationsPage({
  assessmentResult,
  activeCategory,
  onSelectCareer,
  onNavigate,
  onTargetCareerUpdated
}) {
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(activeCategory || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('suitability'); // 'suitability' | 'growth' | 'salary' | 'title'
  const [settingTargetId, setSettingTargetId] = useState(null);
  const [targetSuccessId, setTargetSuccessId] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [categoryFilter]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await getRecommendations(categoryFilter || 'all');
      setRecommendationsData(res);
    } catch (err) {
      console.log('Error loading dynamic recommendations:', err);
      if (assessmentResult && assessmentResult.career_recommendations) {
        setRecommendationsData({
          recommendations: assessmentResult.career_recommendations,
          assessment_score: assessmentResult.assessment_score || 75.0,
          data_completeness: 'Complete',
          message: 'Personalized recommendations from assessment matrix.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsTargetCareer = async (careerId) => {
    try {
      setSettingTargetId(careerId);
      await regenerateActionPlan(careerId);
      setTargetSuccessId(careerId);
      if (onTargetCareerUpdated) {
        onTargetCareerUpdated(careerId);
      }
      setTimeout(() => {
        onNavigate('actionPlan');
      }, 700);
    } catch (err) {
      console.error('Failed to set target career:', err);
    } finally {
      setSettingTargetId(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        textAlign: 'center',
        padding: '56px 24px'
      }}>
        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.15rem' }}>
          Calculating Personalized Career Suitability Scores...
        </div>
        <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 6 }}>
          Evaluating your profile skills, discovery strengths, and technical benchmarks.
        </p>
      </div>
    );
  }

  const recs = recommendationsData?.recommendations || assessmentResult?.career_recommendations || [];
  const isIncomplete = recommendationsData?.data_completeness === 'Incomplete';

  // Filter and sort
  const filteredRecs = recs
    .filter((rec) => {
      if (categoryFilter && categoryFilter !== 'all') {
        if (rec.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = rec.title.toLowerCase().includes(query);
        const matchesSkills = (rec.matching_skills || []).some(s => s.toLowerCase().includes(query));
        const matchesDesc = (rec.description || '').toLowerCase().includes(query);
        return matchesTitle || matchesSkills || matchesDesc;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'suitability') {
        return (b.suitability_score || 0) - (a.suitability_score || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
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
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="saas-badge badge-it">
              <Award size={13} /> AI Recommendation Matrix
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              • Calibrated for India Tech & Non-Tech Pathways
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
            Personalized Career Recommendations
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 8, margin: 0, lineHeight: 1.55 }}>
            Recommendations are evaluated independently across <strong>Career Discovery Interests</strong>, <strong>Profile Skills</strong>, <strong>Technical Skill Assessment</strong>, and <strong>Educational Fit</strong>.
          </p>
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#94A3B8' }}>
            * Note: Suitability percentages represent personalized compatibility estimates and do not guarantee hiring or employment.
          </div>
        </div>

        {recommendationsData?.assessment_score !== undefined && (
          <div style={{
            background: '#F8FAFC',
            padding: '14px 22px',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            minWidth: 150
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              {recommendationsData.has_assessment === false ? 'Assessment Status' : 'Assessment Accuracy'}
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: recommendationsData.has_assessment === false ? '#D97706' : '#4F46E5', display: 'block', marginTop: 2 }}>
              {recommendationsData.has_assessment === false ? 'Pending' : `${recommendationsData.assessment_score}%`}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500 }}>
              {recommendationsData.has_assessment === false ? 'Technical test pending' : 'Verified by testing'}
            </span>
          </div>
        )}
      </div>

      {/* Notice Banner for Incomplete Data */}
      {isIncomplete && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          padding: '16px 20px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <Info size={22} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Skill Assessment Pending — Unlock Verified Technical Suitability
              </div>
              <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: 2, lineHeight: 1.45 }}>
                {recommendationsData.message || "Your recommendations currently reflect your Career Discovery domain interests and profile. Complete the Skill Assessment to verify matching skills and discover exact skill gaps."}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => onNavigate('careerDiscovery')}
              className="btn btn-outline"
              style={{ padding: '7px 14px', fontSize: '0.8rem', background: '#FFFFFF' }}
            >
              Career Discovery
            </button>
            <button
              onClick={() => onNavigate('assessment')}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.8rem' }}
            >
              Take Skill Assessment →
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
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
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search roles or skills (e.g., Python, Data, Cloud)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 32, fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
            {['all', 'IT', 'Non-IT'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="btn"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  border: 'none',
                  background: categoryFilter === cat ? '#FFFFFF' : 'transparent',
                  color: categoryFilter === cat ? '#0F172A' : '#64748B',
                  fontWeight: categoryFilter === cat ? 700 : 500,
                  boxShadow: categoryFilter === cat ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {cat === 'all' ? 'All Roles' : `${cat} Careers`}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpDown size={14} color="#64748B" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto' }}
            >
              <option value="suitability">Sort by Fit / Suitability</option>
              <option value="title">Sort Alphabetically (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendation Cards List */}
      {!filteredRecs.length ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          textAlign: 'center',
          padding: '48px 24px'
        }}>
          <HelpCircle size={32} color="#D97706" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>No Matching Roles Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: 440, margin: '6px auto 0' }}>
            Try clearing your search query or switching categories.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredRecs.map((rec) => {
            const matchingList = rec.matching_skills || [];
            const missingList = rec.missing_skills || rec.skill_gaps?.filter((g) => g.status === 'Improve').map(g => g.skill_name) || [];
            const isSettingThis = settingTargetId === rec.career_id;
            const isSuccessThis = targetSuccessId === rec.career_id;
            const isPending = Boolean(rec.is_assessment_pending);

            return (
              <div
                key={rec.career_id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  height: '100%',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Header: Title + Category + Suitability Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '1.22rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                      lineHeight: 1.35,
                      wordBreak: 'break-word'
                    }}>
                      {rec.title}
                    </h3>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`saas-badge ${rec.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                        {rec.category} Pathway
                      </span>
                      {isPending && (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FDE68A',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 9999
                        }}>
                          Assessment Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Suitability / Preliminary Fit Badge */}
                  <div style={{
                    background: isPending ? '#FFFBEB' : '#EEF2FF',
                    border: `1px solid ${isPending ? '#FDE68A' : '#C7D2FE'}`,
                    color: isPending ? '#B45309' : '#4F46E5',
                    padding: '8px 12px',
                    borderRadius: 12,
                    textAlign: 'center',
                    minWidth: 90,
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                      {isPending ? 'Preliminary Fit' : 'Suitability'}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>
                      {rec.suitability_score !== undefined ? `${rec.suitability_score}%` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: isPending ? '#D97706' : '#059669', marginTop: 2 }}>
                      {isPending ? 'Discovery Est.' : 'Verified Fit'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.85rem',
                  color: '#475569',
                  lineHeight: 1.5,
                  margin: 0,
                  minWidth: 0,
                  wordBreak: 'break-word'
                }}>
                  {rec.description}
                </p>

                {/* Why this matches you */}
                {rec.reason && (
                  <div style={{
                    background: '#F8FAFC',
                    borderLeft: '3px solid #4F46E5',
                    padding: '10px 14px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.8rem',
                    minWidth: 0
                  }}>
                    <strong style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <Sparkles size={14} /> Why this matches you:
                    </strong>
                    <span style={{ color: '#334155', lineHeight: 1.45, display: 'block' }}>{rec.reason}</span>
                  </div>
                )}

                {/* Salary & Growth Stats Strip (2-Column Grid with No-Wrap protection) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  background: '#F8FAFC',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #F1F5F9',
                  boxSizing: 'border-box'
                }}>
                  {/* Salary Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#ECFDF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IndianRupee size={16} color="#059669" />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Avg Salary (India)
                      </div>
                      <div style={{
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {formatSalary(rec.average_salary) || '₹6.5 - ₹16 LPA (approx.)'}
                      </div>
                    </div>
                  </div>

                  {/* Growth Rate Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <TrendingUp size={16} color="#4F46E5" />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Growth Rate
                      </div>
                      <div style={{
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {rec.growth_rate || 'High Growth'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Alignment Indicator */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.74rem',
                  color: '#64748B',
                  background: '#FAFAFA',
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px dashed #E2E8F0',
                  flexWrap: 'wrap',
                  gap: 6
                }}>
                  <span>
                    <strong>Interest Match:</strong> {rec.interest_match !== undefined ? `${rec.interest_match}%` : '50%'}
                  </span>
                  <span>
                    <strong>Skill Assessment:</strong>{' '}
                    {isPending ? (
                      <span style={{ color: '#D97706', fontWeight: 700 }}>Pending</span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 700 }}>{rec.assessment_match}%</span>
                    )}
                  </span>
                </div>

                {/* Matching Skills */}
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#059669',
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <CheckCircle2 size={14} /> Matching Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matchingList.length > 0 ? (
                      matchingList.map((sk, sIdx) => (
                        <span key={sIdx} style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #A7F3D0',
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 600
                        }}>
                          ✓ {sk}
                        </span>
                      ))
                    ) : isPending ? (
                      <div style={{
                        fontSize: '0.76rem',
                        color: '#64748B',
                        background: '#F8FAFC',
                        border: '1px dashed #CBD5E1',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontStyle: 'italic',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        Complete your Skill Assessment to identify matching skills.
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        No matching verified skills yet for this role.
                      </span>
                    )}
                  </div>
                </div>

                {/* Skills to Improve / Target Competencies */}
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isPending ? '#475569' : '#DC2626',
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <AlertCircle size={14} color={isPending ? '#D97706' : '#DC2626'} />
                    {isPending ? 'Required Role Competencies (Pending Assessment):' : 'Skills to Improve:'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {missingList.length > 0 ? (
                      missingList.map((ms, gIdx) => (
                        <span key={gIdx} style={{
                          background: isPending ? '#F1F5F9' : '#FEF2F2',
                          color: isPending ? '#334155' : '#991B1B',
                          border: isPending ? '1px solid #E2E8F0' : '1px solid #FECACA',
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 600
                        }}>
                          • {typeof ms === 'string' ? ms : ms.skill_name}
                        </span>
                      ))
                    ) : isPending ? (
                      <div style={{
                        fontSize: '0.76rem',
                        color: '#64748B',
                        background: '#F8FAFC',
                        border: '1px dashed #CBD5E1',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontStyle: 'italic',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        Complete your Skill Assessment to identify verified skill gaps.
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>
                        All core skills verified and satisfied!
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons (Anchored cleanly to bottom of card) */}
                <div style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 16,
                  marginTop: 'auto',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center'
                }}>
                  <button
                    type="button"
                    onClick={() => onSelectCareer(rec.career_id)}
                    className="btn btn-outline"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAsTargetCareer(rec.career_id)}
                    disabled={isSettingThis}
                    className="btn btn-primary"
                    style={{
                      flex: 1.25,
                      padding: '9px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {isSuccessThis ? (
                      <>
                        <Check size={14} />
                        <span>Target Selected!</span>
                      </>
                    ) : isSettingThis ? (
                      <span>Saving Goal...</span>
                    ) : (
                      <>
                        <Target size={14} />
                        <span>Select as Target Career</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
