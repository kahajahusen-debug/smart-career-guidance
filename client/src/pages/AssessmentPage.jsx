import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchSkillAssessmentQuestions, submitSkillAssessment, getSkillAssessmentResult } from '../services/api';
import { 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Zap, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target
} from 'lucide-react';

export default function AssessmentPage({ user, onAssessmentSubmitted, onNavigate }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: selected_option_index }
  const [skillResult, setSkillResult] = useState(null);
  const [viewingResult, setViewingResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const [qRes, existingRes] = await Promise.all([
        fetchSkillAssessmentQuestions('all').catch(() => ({ questions: [] })),
        getSkillAssessmentResult().catch(() => null)
      ]);

      const loadedQ = qRes.questions || [];
      // Select representative 15 questions covering diverse skill categories
      const selectedQuestions = loadedQ.slice(0, 15);
      setQuestions(selectedQuestions);

      if (existingRes && existingRes.overall_accuracy !== undefined) {
        setSkillResult(existingRes);
        setViewingResult(true);
      }
    } catch (err) {
      setErrorMsg('Failed to load assessment data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setErrorMsg(null);
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionIndex
    }));
  };

  const handleNext = () => {
    const currentQ = questions[currentIndex];
    if (answers[String(currentQ.id)] === undefined) {
      setErrorMsg('Please select one option before proceeding.');
      return;
    }
    setErrorMsg(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setErrorMsg(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const totalAnswered = Object.keys(answers).length;
    if (totalAnswered < questions.length) {
      setErrorMsg(`Please answer all ${questions.length} questions before submitting. (${totalAnswered}/${questions.length} answered)`);
      return;
    }

    try {
      setSubmitting(true);
      const result = await submitSkillAssessment(answers);
      setSkillResult(result);
      setViewingResult(true);
      if (onAssessmentSubmitted) {
        onAssessmentSubmitted(result);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Assessment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeAssessment = () => {
    setAnswers({});
    setCurrentIndex(0);
    setErrorMsg(null);
    setViewingResult(false);
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Preparing Advanced Skill Assessment...
        </div>
      </GlassCard>
    );
  }

  // --- RESULT VIEW ---
  if (viewingResult && skillResult) {
    const { 
      overall_accuracy, 
      total_questions, 
      correct_answers, 
      strong_skills, 
      moderate_skills, 
      improve_skills, 
      skill_details,
      discovery_alignment
    } = skillResult;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 920, margin: '0 auto' }}>
        {/* Header Hero */}
        <GlassCard style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(79, 70, 229, 0.92) 100%)',
          color: '#FFFFFF',
          padding: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Award size={22} color="#FBBF24" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase' }}>
                  Skill Assessment Completed
                </span>
              </div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0 }}>
                Your Skill Proficiency Results
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#E2E8F0', marginTop: 8, maxWidth: 620 }}>
                Evaluated across multiple technical and professional domain questions. Here is your categorized proficiency profile and discovery alignment.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '12px 20px',
                borderRadius: 14,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38BDF8' }}>
                  {overall_accuracy}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                  Accuracy ({correct_answers}/{total_questions})
                </div>
              </div>

              <button
                onClick={handleRetakeAssessment}
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <RotateCcw size={16} /> Retake Assessment
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Discovery Alignment Connection Banner */}
        {discovery_alignment && (
          <GlassCard style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#4F46E5',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 44
              }}>
                <Target size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    Career Discovery Connection
                  </h3>
                  <span style={{
                    background: 'rgba(79, 70, 229, 0.15)',
                    color: '#4F46E5',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    Top Interest: {discovery_alignment.top_interest_area} ({discovery_alignment.top_interest_percentage}%)
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#334155', marginTop: 8, lineHeight: 1.5 }}>
                  {discovery_alignment.summary}
                </p>
                {discovery_alignment.matching_strong_skills?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      Domain Reinforcing Skills:
                    </span>
                    {discovery_alignment.matching_strong_skills.map((sk, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#047857',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* 3 Tier Skill Summary (Strong, Moderate, Needs Improvement) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {/* Strong Skills */}
          <GlassCard style={{ padding: '22px', borderTop: '4px solid #10B981' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#047857', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> Strong Skills (≥75%)
              </h4>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#047857', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>
                {strong_skills?.length || 0}
              </span>
            </div>
            {strong_skills?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {strong_skills.map((sk, i) => (
                  <span key={i} style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '5px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700 }}>
                    {sk}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>No strong skills identified yet.</span>
            )}
          </GlassCard>

          {/* Moderate Skills */}
          <GlassCard style={{ padding: '22px', borderTop: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#B45309', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} /> Moderate Skills (50-74%)
              </h4>
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#B45309', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>
                {moderate_skills?.length || 0}
              </span>
            </div>
            {moderate_skills?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {moderate_skills.map((sk, i) => (
                  <span key={i} style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '5px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700 }}>
                    {sk}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>No moderate skills identified.</span>
            )}
          </GlassCard>

          {/* Skills Needing Improvement */}
          <GlassCard style={{ padding: '22px', borderTop: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#B91C1C', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={20} /> Needs Improvement (&lt;50%)
              </h4>
              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#B91C1C', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>
                {improve_skills?.length || 0}
              </span>
            </div>
            {improve_skills?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {improve_skills.map((sk, i) => (
                  <span key={i} style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '5px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700 }}>
                    {sk}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Great job! No skills in improvement zone.</span>
            )}
          </GlassCard>
        </div>

        {/* Detailed Skill Breakdown Table */}
        <GlassCard style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 20 }}>
            Detailed Skill Proficiency Matrix
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Skill Name</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Assessed Score</th>
                  <th style={{ padding: '12px 16px' }}>Proficiency Level</th>
                  <th style={{ padding: '12px 16px' }}>Status Tier</th>
                </tr>
              </thead>
              <tbody>
                {skill_details?.map((item, idx) => {
                  let badgeClass = 'badge-it';
                  if (item.status_tier === 'Strong') badgeClass = 'badge-it';
                  else if (item.status_tier === 'Moderate') badgeClass = 'badge-nonit';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                        {item.skill_name}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>
                        {item.category}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 800, color: item.score >= 75 ? '#059669' : item.score >= 50 ? '#D97706' : '#DC2626' }}>
                            {item.score}%
                          </span>
                          <div style={{ flex: 1, maxWidth: 100, background: '#E2E8F0', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                              width: `${item.score}%`,
                              height: '100%',
                              background: item.score >= 75 ? '#059669' : item.score >= 50 ? '#D97706' : '#DC2626',
                              borderRadius: 999
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                        {item.proficiency_level}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`glass-badge ${badgeClass}`}>
                          {item.status_tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('recommendations');
              }}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: 10,
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none'
              }}
            >
              <span>Proceed to Career Recommendations</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- QUESTIONNAIRE QUIZ RUNNER VIEW ---
  if (!questions.length) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#EF4444', fontWeight: 600 }}>No assessment questions available at this time.</div>
      </GlassCard>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
  const selectedOption = answers[String(currentQ.id)];
  const totalAnswered = Object.keys(answers).length;

  return (
    <div style={{ maxWidth: 740, margin: '20px auto' }}>
      <GlassCard style={{ padding: '36px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #172554 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Smart Skill Assessment
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Question {currentIndex + 1} of {questions.length} ({totalAnswered} Answered)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#7C3AED',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              {currentQ.skill_name}
            </span>
            <span style={{
              background: 'rgba(15, 23, 42, 0.08)',
              color: '#334155',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              Diff: {currentQ.difficulty}/5
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: '#E2E8F0', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: '0.88rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Question Text */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.5 }}>
            {currentQ.question_text}
          </h3>
        </div>

        {/* Radio Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {currentQ.options?.map((optText, oIdx) => {
            const isSelected = selectedOption === oIdx;
            return (
              <label
                key={oIdx}
                onClick={() => handleSelectOption(currentQ.id, oIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: isSelected ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                  background: isSelected ? 'rgba(79, 70, 229, 0.08)' : '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name={`question_${currentQ.id}`}
                  checked={isSelected}
                  onChange={() => handleSelectOption(currentQ.id, oIdx)}
                  style={{ width: 18, height: 18, accentColor: '#4F46E5' }}
                />
                <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#172554' : '#334155' }}>
                  {optText}
                </span>
              </label>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="btn btn-outline"
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              opacity: currentIndex === 0 ? 0.5 : 1,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="btn"
              style={{
                background: '#172554',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>Next Question</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: 10,
                fontSize: '0.92rem',
                fontWeight: 800,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              <CheckCircle2 size={18} />
              {submitting ? 'Calculating Skill Scores...' : 'Submit Skill Assessment'}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
