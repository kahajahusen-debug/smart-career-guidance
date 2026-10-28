import React, { useState, useEffect } from 'react';
import { getRecommendations, regenerateActionPlan } from '../services/api';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
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
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="saas-badge badge-it">
              <Award size={13} /> AI Recommendation Matrix
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Personalized Career Recommendations
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 6, margin: 0, lineHeight: 1.5 }}>
            Ranked based on your Profile Skills (35%), Career Discovery (25%), Skill Assessment (20%), Education (10%), and Domain Interests (10%).
          </p>
        </div>

        {recommendationsData?.assessment_score !== undefined && (
          <div style={{
            background: '#F8FAFC',
            padding: '12px 20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Assessment Accuracy</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5', display: 'block' }}>
              {recommendationsData.assessment_score}%
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={20} color="#D97706" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Refine Your Match Accuracy
              </div>
              <div style={{ fontSize: '0.8rem', color: '#B45309' }}>
                {recommendationsData.message || "Complete Career Discovery and Skill Assessment to unlock 100% calibrated recommendations."}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onNavigate('careerDiscovery')}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#FFFFFF' }}
            >
              Career Discovery
            </button>
            <button
              onClick={() => onNavigate('assessment')}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Take Assessment →
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
            placeholder="Search roles or skills (e.g., Python, Cloud)..."
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
                  padding: '4px 10px',
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
                {cat === 'all' ? 'All Roles' : cat}
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
              style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto' }}
            >
              <option value="suitability">Sort by Suitability Score</option>
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

            return (
              <div
                key={rec.career_id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                      {rec.title}
                    </h3>
                    <div style={{ marginTop: 6 }}>
                      <span className={`saas-badge ${rec.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                        {rec.category} Pathway
                      </span>
                    </div>
                  </div>

                  <div style={{
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    color: '#4F46E5',
                    padding: '8px 14px',
                    borderRadius: 12,
                    textAlign: 'center',
                    minWidth: 80
                  }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Suitability
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                      {rec.suitability_score}%
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {rec.description}
                </p>

                {/* Why this matches you */}
                {rec.reason && (
                  <div style={{
                    background: '#F8FAFC',
                    borderLeft: '3px solid #4F46E5',
                    padding: '10px 14px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.8rem'
                  }}>
                    <strong style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Sparkles size={13} /> Why this matches you:
                    </strong>
                    <span style={{ color: '#334155' }}>{rec.reason}</span>
                  </div>
                )}

                {/* Salary & Growth Stats */}
                <div style={{ display: 'flex', gap: 16, background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={15} color="#059669" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Avg Salary</div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{rec.average_salary || 'Competitive'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={15} color="#4F46E5" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Growth Rate</div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{rec.growth_rate || 'High Growth'}</div>
                    </div>
                  </div>
                </div>

                {/* Matching Skills */}
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Matching Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matchingList.length > 0 ? matchingList.map((sk, sIdx) => (
                      <span key={sIdx} style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        fontWeight: 600
                      }}>
                        ✓ {sk}
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>None identified yet</span>
                    )}
                  </div>
                </div>

                {/* Skills to Improve */}
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={13} /> Skills to Improve:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {missingList.length > 0 ? missingList.map((ms, gIdx) => (
                      <span key={gIdx} style={{
                        background: '#FEF2F2',
                        color: '#991B1B',
                        border: '1px solid #FECACA',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        fontWeight: 600
                      }}>
                        • {typeof ms === 'string' ? ms : ms.skill_name}
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>All core skills satisfied!</span>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 'auto', display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => onSelectCareer(rec.career_id)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => handleSelectAsTargetCareer(rec.career_id)}
                    disabled={isSettingThis}
                    className="btn btn-primary"
                    style={{
                      flex: 1.2,
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 700
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
