import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getCareerResults, setTargetCareerResult, updateCareerResultProgress } from '../services/api';
import { formatSalary } from '../utils/formatters';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Info,
  Search,
  Target,
  Check,
  Briefcase,
  Bot,
  Layers,
  ChevronRight,
  BookOpen,
  FolderGit2,
  Clock,
  RotateCcw
} from 'lucide-react';

export default function CareerResultsPage({
  user,
  assessmentResult,
  onSelectCareer,
  onNavigate,
  onTargetCareerUpdated,
  initialTab = 'matches'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'matches' | 'roadmap'
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('suitability'); // 'suitability' | 'salary' | 'growth'
  const [settingTargetId, setSettingTargetId] = useState(null);
  const [targetSuccessId, setTargetSuccessId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  useEffect(() => {
    loadResults();
  }, [categoryFilter]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await getCareerResults(categoryFilter);
      setResultsData(res);
    } catch (err) {
      console.log('Error loading dynamic career results:', err);
      // Fallback to assessment result if available
      if (assessmentResult && assessmentResult.career_recommendations) {
        setResultsData({
          recommendations: assessmentResult.career_recommendations,
          assessment_score: assessmentResult.assessment_score || 75.0,
          data_completeness: 'Complete',
          message: 'Career results generated from assessment benchmarks.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async (careerId) => {
    try {
      setSettingTargetId(careerId);
      const res = await setTargetCareerResult(careerId);
      setTargetSuccessId(careerId);
      if (res && res.action_plan) {
        setResultsData(prev => ({
          ...prev,
          action_plan: res.action_plan,
          target_career_id: res.action_plan.target_career_id,
          target_career_title: res.action_plan.target_career_title,
          target_career_category: res.action_plan.target_career_category,
          readiness_score: res.action_plan.readiness_score,
          roadmap: res.action_plan.roadmap,
          milestones: res.action_plan.milestones
        }));
      }
      if (onTargetCareerUpdated) {
        onTargetCareerUpdated(careerId);
      }
    } catch (err) {
      console.error('Failed to set target career:', err);
    } finally {
      setSettingTargetId(null);
    }
  };

  const handleUpdateRoadmapStatus = async (itemId, itemType, newStatus) => {
    try {
      setUpdatingItemId(itemId);
      const res = await updateCareerResultProgress(itemId, itemType, newStatus);
      if (res && res.action_plan) {
        setResultsData(prev => ({
          ...prev,
          action_plan: res.action_plan,
          readiness_score: res.action_plan.readiness_score,
          roadmap: res.action_plan.roadmap,
          milestones: res.action_plan.milestones
        }));
      }
    } catch (err) {
      console.error('Failed to update progress status:', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        textAlign: 'center',
        padding: '56px 24px',
        maxWidth: 1000,
        margin: '0 auto'
      }}>
        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.2rem' }}>
          Calculating Personalized Career Results...
        </div>
        <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: 8 }}>
          Evaluating your verified skills, discovery interest domains, and educational profile.
        </p>
      </div>
    );
  }

  const recs = resultsData?.recommendations || resultsData?.career_recommendations || [];
  const actionPlan = resultsData?.action_plan;
  const currentTargetId = resultsData?.target_career_id || actionPlan?.target_career_id;
  const isIncomplete = resultsData?.data_completeness === 'Incomplete';
  const hasDiscovery = resultsData?.has_discovery !== false;
  const hasAssessment = resultsData?.has_assessment !== false;

  // Filter and sort recommendations
  const filteredRecs = recs
    .filter(car => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchTitle = car.title?.toLowerCase().includes(term);
      const matchCat = car.category?.toLowerCase().includes(term);
      const matchSkills = car.matching_skills?.some(s => s.toLowerCase().includes(term)) ||
        car.required_skills?.some(s => (typeof s === 'string' ? s : s.skill_name || '').toLowerCase().includes(term));
      return matchTitle || matchCat || matchSkills;
    })
    .sort((a, b) => {
      if (sortBy === 'suitability') {
        return (b.suitability_score || 0) - (a.suitability_score || 0);
      }
      if (sortBy === 'salary') {
        const getNum = (str) => parseInt(String(str).replace(/[^0-9]/g, '')) || 0;
        return getNum(b.average_salary) - getNum(a.average_salary);
      }
      if (sortBy === 'growth') {
        return (parseInt(b.growth_rate) || 0) - (parseInt(a.growth_rate) || 0);
      }
      return 0;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Banner & Tab Navigation */}
      <GlassCard style={{
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.98) 0%, rgba(79, 70, 229, 0.92) 100%)',
        color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Verified Matching Engine
              </span>
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px 0' }}>
              Career Results
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#E2E8F0', maxWidth: 650, margin: 0, lineHeight: 1.5 }}>
              Personalized career matches and actionable milestones generated from your Career Discovery interests, Skill Assessment performance, and educational background.
            </p>
          </div>

          {/* Tab Switcher */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            padding: 4,
            borderRadius: 12,
            display: 'flex',
            gap: 4
          }}>
            <button
              onClick={() => setActiveTab('matches')}
              style={{
                background: activeTab === 'matches' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'matches' ? '#172554' : '#FFFFFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <Award size={16} />
              <span>Career Matches ({recs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              style={{
                background: activeTab === 'roadmap' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'roadmap' ? '#172554' : '#FFFFFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <Target size={16} />
              <span>Action Roadmap</span>
              {resultsData?.target_career_title && (
                <span style={{
                  background: activeTab === 'roadmap' ? '#4F46E5' : 'rgba(255,255,255,0.25)',
                  color: '#FFFFFF',
                  padding: '2px 6px',
                  borderRadius: 999,
                  fontSize: '0.7rem'
                }}>
                  Active
                </span>
              )}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Advisory Banner if assessments are incomplete */}
      {(!hasDiscovery || !hasAssessment || isIncomplete) && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={22} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400E' }}>
                Complete Assessments for 100% Verified Match Accuracy
              </div>
              <div style={{ fontSize: '0.82rem', color: '#B45309', marginTop: 2 }}>
                {!hasDiscovery && !hasAssessment
                  ? 'Complete Career Discovery and Skill Assessment to unlock benchmarked matching accuracy.'
                  : !hasDiscovery
                  ? 'Complete Career Discovery to align matching with your preferred work domains.'
                  : 'Complete your Skill Assessment to test technical competencies against role benchmarks.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!hasDiscovery && (
              <button
                onClick={() => onNavigate('careerDiscovery')}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: '#D97706', color: '#92400E', fontWeight: 700 }}
              >
                Go to Discovery →
              </button>
            )}
            {!hasAssessment && (
              <button
                onClick={() => onNavigate('assessment')}
                className="btn"
                style={{ padding: '8px 14px', fontSize: '0.82rem', background: '#D97706', color: '#FFFFFF', fontWeight: 700, border: 'none' }}
              >
                Take Skill Assessment →
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: CAREER MATCHES */}
      {activeTab === 'matches' && (
        <>
          {/* Explanation & Disclaimer Banner */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '14px 18px',
            fontSize: '0.84rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <Info size={18} color="#4F46E5" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: '#0F172A' }}>How Suitability Is Calculated:</strong> Matching percentages are calculated from your actual data across 5 dimensions: Skill Match (35%), Career Discovery Interests (25%), Skill Assessment Accuracy (20%), Educational Background Fit (10%), and Work Style / Domain Preferences (10%).
              <div style={{ marginTop: 4, color: '#64748B', fontStyle: 'italic', fontSize: '0.78rem' }}>
                * Suitability score is an estimated benchmark of alignment based on your entered profile and verified test scores, not a legal or contractual guarantee of employment.
              </div>
            </div>
          </div>

          {/* Controls: Category Filter, Search, Sort */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            padding: '12px 18px',
            borderRadius: 12
          }}>
            {/* Category Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Careers' },
                { id: 'IT', label: 'IT Pathways' },
                { id: 'Non-IT', label: 'Non-IT Pathways' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: categoryFilter === cat.id ? 700 : 500,
                    background: categoryFilter === cat.id ? '#4F46E5' : '#F1F5F9',
                    color: categoryFilter === cat.id ? '#FFFFFF' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter by title or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '7px 12px 7px 32px',
                    fontSize: '0.82rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    outline: 'none',
                    width: 200
                  }}
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 10px',
                  fontSize: '0.82rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 600
                }}
              >
                <option value="suitability">Sort by Suitability %</option>
                <option value="salary">Sort by Salary</option>
                <option value="growth">Sort by Growth Rate</option>
              </select>
            </div>
          </div>

          {/* Career Cards List */}
          {filteredRecs.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
              <AlertCircle size={32} color="#94A3B8" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172554', margin: 0 }}>
                No Career Matches Found
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
                Try adjusting your search query or switching categories.
              </p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {filteredRecs.map((career) => {
                const isTarget = (currentTargetId === career.career_id) || (targetSuccessId === career.career_id);
                const score = career.suitability_score || 70;
                const scoreColor = score >= 80 ? '#10B981' : score >= 65 ? '#4F46E5' : '#F59E0B';
                const scoreBg = score >= 80 ? '#ECFDF5' : score >= 65 ? '#EEF2FF' : '#FFFBEB';
                const scoreBorder = score >= 80 ? '#A7F3D0' : score >= 65 ? '#C7D2FE' : '#FDE68A';

                return (
                  <GlassCard
                    key={career.career_id}
                    style={{
                      padding: '24px 28px',
                      borderRadius: 14,
                      border: isTarget ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                      boxShadow: isTarget ? '0 8px 24px rgba(79, 70, 229, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                      background: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16
                    }}
                  >
                    {/* Top Row: Title, Category, Target Badge, Suitability Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span className={`glass-badge ${career.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                            {career.category}
                          </span>
                          {isTarget && (
                            <span style={{
                              background: '#4F46E5',
                              color: '#FFFFFF',
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Target size={12} /> My Target Career
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 6px 0' }}>
                          {career.title}
                        </h3>

                        <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, maxWidth: 700, lineHeight: 1.5 }}>
                          {career.description}
                        </p>
                      </div>

                      {/* Suitability Score Box */}
                      <div style={{
                        background: scoreBg,
                        border: `1px solid ${scoreBorder}`,
                        padding: '12px 20px',
                        borderRadius: 12,
                        textAlign: 'center',
                        minWidth: 120,
                        flexShrink: 0
                      }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreColor, textTransform: 'uppercase' }}>
                          Compatibility
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: scoreColor, lineHeight: 1.1 }}>
                          {score}%
                        </div>
                      </div>
                    </div>

                    {/* Why this career matches the user */}
                    {career.reason && (
                      <div style={{
                        background: '#F8FAFC',
                        borderLeft: '4px solid #4F46E5',
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}>
                        <Sparkles size={16} color="#4F46E5" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Why this career matches you: </strong>
                          {career.reason}
                        </div>
                      </div>
                    )}

                    {/* Breakdown Metrics: Interest Match, Skill Match, Educational Fit */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 12,
                      background: '#F1F5F9',
                      padding: '12px 16px',
                      borderRadius: 10
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Interest Match</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                          {career.interest_match !== undefined ? `${career.interest_match}%` : 'N/A'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Skill Match</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                          {career.skill_match !== undefined ? `${career.skill_match}%` : 'N/A'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Educational Fit</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                          {career.education_match !== undefined ? `${career.education_match}%` : '75%'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Average Salary (India)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669' }}>
                          {formatSalary(career.average_salary)}
                        </div>
                      </div>
                    </div>

                    {/* Skills Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                      {/* Skills User Already Knows */}
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#047857', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={14} /> Skills You Already Know
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {career.matching_skills?.length > 0 ? (
                            career.matching_skills.map((sk, idx) => (
                              <span key={idx} style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                                ✓ {sk}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              None verified yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Required Skills for Career */}
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Layers size={14} /> Required Skills for Career
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {career.required_skills?.length > 0 ? (
                            career.required_skills.slice(0, 5).map((sk, idx) => (
                              <span key={idx} style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                                • {typeof sk === 'string' ? sk : sk.skill_name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Core role skills</span>
                          )}
                        </div>
                      </div>

                      {/* Skills You Need to Improve */}
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B45309', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertCircle size={14} /> Skills to Improve
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {career.missing_skills?.length > 0 ? (
                            career.missing_skills.slice(0, 4).map((sk, idx) => (
                              <span key={idx} style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                                ↑ {typeof sk === 'string' ? sk : sk.skill_name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                              ✓ Excellent readiness
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      paddingTop: 14,
                      borderTop: '1px solid #F1F5F9'
                    }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => onNavigate('assistant', { prompt: `What learning steps and portfolio projects do you recommend for becoming a successful ${career.title}?` })}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Bot size={14} /> Ask AI Assistant
                        </button>

                        <button
                          onClick={() => onNavigate('interview', { career: career.title })}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Briefcase size={14} /> Practice Interview
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleSetTarget(career.career_id)}
                          disabled={settingTargetId === career.career_id}
                          style={{
                            background: isTarget ? '#EEF2FF' : '#F8FAFC',
                            color: isTarget ? '#4F46E5' : '#334155',
                            border: isTarget ? '1px solid #C7D2FE' : '1px solid #CBD5E1',
                            padding: '8px 16px',
                            borderRadius: 8,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          {isTarget ? <Check size={14} color="#4F46E5" /> : <Target size={14} />}
                          <span>{isTarget ? 'Target Selected' : settingTargetId === career.career_id ? 'Saving...' : 'Set as Target'}</span>
                        </button>

                        <button
                          onClick={() => onSelectCareer(career.career_id)}
                          className="btn btn-primary"
                          style={{
                            padding: '8px 18px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span>View Career Details</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: ACTION ROADMAP & MILESTONES */}
      {activeTab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Target Career Overview Card */}
          <GlassCard style={{ padding: '24px 28px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span className="glass-badge badge-it" style={{ marginBottom: 6 }}>
                  Target Career Pathway
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 6px 0' }}>
                  {resultsData?.target_career_title || actionPlan?.target_career_title || 'Select a Target Career'}
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
                  Strategic milestones, skill gap remediation, and project roadmap designed for this pathway.
                </p>
              </div>

              {/* Target Switcher dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Change Target:</span>
                <select
                  value={currentTargetId || ''}
                  onChange={(e) => handleSetTarget(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    fontWeight: 700,
                    color: '#172554'
                  }}
                >
                  {recs.map(c => (
                    <option key={c.career_id} value={c.career_id}>
                      {c.title} ({c.suitability_score}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Readiness Score Strip */}
            <div style={{
              display: 'flex',
              gap: 24,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #F1F5F9',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                  Job Readiness Score
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4F46E5' }}>
                  {resultsData?.readiness_score || actionPlan?.readiness_score || 60}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                  Target Suitability
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981' }}>
                  {actionPlan?.suitability_score || (recs.find(r => r.career_id === currentTargetId)?.suitability_score) || 75}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Milestones
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>
                  {(resultsData?.milestones || actionPlan?.milestones || []).length || 4} Phases
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Milestone Checklist */}
          <GlassCard style={{ padding: '24px 28px', borderRadius: 14 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} color="#4F46E5" /> Step-by-Step Learning Roadmap
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(resultsData?.milestones || actionPlan?.milestones || [
                { id: 'm1', title: 'Phase 1: Foundational Core Concepts', description: 'Master foundational syntax, concepts, and primary role tools.', status: 'Completed' },
                { id: 'm2', title: 'Phase 2: Applied Technical Specialization', description: 'Build practical fluency in core domain frameworks and libraries.', status: 'In Progress' },
                { id: 'm3', title: 'Phase 3: Portfolio & Production Projects', description: 'Complete 2 full-scale portfolio projects to prove real-world proficiency.', status: 'Not Started' },
                { id: 'm4', title: 'Phase 4: Interview & Job Application Readiness', description: 'Conduct mock interviews and finalize resume keyword alignment.', status: 'Not Started' }
              ]).map((m, idx) => {
                const isCompleted = m.status === 'Completed' || m.completed;
                const isInProgress = m.status === 'In Progress';

                return (
                  <div
                    key={m.id || idx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '16px 20px',
                      background: isCompleted ? '#F0FDF4' : isInProgress ? '#EEF2FF' : '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{
                        background: isCompleted ? '#10B981' : isInProgress ? '#4F46E5' : '#CBD5E1',
                        color: '#FFFFFF',
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 2
                      }}>
                        {isCompleted ? '✓' : idx + 1}
                      </span>

                      <div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                          {m.title || m.milestone_name}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: 3 }}>
                          {m.description}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Not Started', 'In Progress', 'Completed'].map(st => (
                        <button
                          key={st}
                          onClick={() => handleUpdateRoadmapStatus(m.id || `m_${idx}`, 'milestone', st)}
                          disabled={updatingItemId === (m.id || `m_${idx}`)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: m.status === st ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                            background: m.status === st ? '#4F46E5' : '#FFFFFF',
                            color: m.status === st ? '#FFFFFF' : '#64748B'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Recommended Portfolio Projects for Target Career */}
          <GlassCard style={{ padding: '24px 28px', borderRadius: 14 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderGit2 size={20} color="#10B981" /> Practical Portfolio Project Recommendations
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {(resultsData?.recommended_projects || actionPlan?.recommended_projects || [
                { title: 'Full Stack Modern Web Application', difficulty: 'Intermediate', description: 'Design a responsive web application with JWT auth, database CRUD, and REST APIs.', skills_covered: ['React', 'Node.js', 'MongoDB'] },
                { title: 'Data Analytics & KPI Dashboard', difficulty: 'Intermediate', description: 'Clean real-world data and build interactive visualization charts.', skills_covered: ['Python', 'SQL', 'Data Visualization'] }
              ]).slice(0, 2).map((proj, idx) => (
                <div key={idx} style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '16px',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                        {proj.title || proj.project_name}
                      </span>
                      <span className="glass-badge badge-it" style={{ fontSize: '0.68rem' }}>
                        {proj.difficulty || 'Intermediate'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                      {proj.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {proj.skills_covered?.map((sk, sIdx) => (
                        <span key={sIdx} style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('projects')}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    View Project in Catalog →
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

