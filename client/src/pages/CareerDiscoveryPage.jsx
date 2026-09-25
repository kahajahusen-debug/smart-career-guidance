import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchDiscoveryQuestions, submitDiscoveryAnswers, getDiscoveryResult } from '../services/api';
import { 
  Compass, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BarChart2, 
  ArrowRight, 
  RotateCcw,
  Briefcase
} from 'lucide-react';

export default function CareerDiscoveryPage({ user, onNavigate, onSelectCareer }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { cd_q01: option_index }
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [viewingResult, setViewingResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      // Fetch questions and check for existing discovery result
      const [qData, existingRes] = await Promise.all([
        fetchDiscoveryQuestions().catch(() => ({ questions: [] })),
        getDiscoveryResult().catch(() => null)
      ]);

      const loadedQuestions = qData.questions || [];
      setQuestions(loadedQuestions);

      if (existingRes && existingRes.success && existingRes.result) {
        setDiscoveryResult(existingRes.result);
        setViewingResult(true);
      }
    } catch (err) {
      setErrorMsg('Failed to load Career Discovery data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNext = () => {
    const currentQ = questions[currentIndex];
    if (answers[currentQ.id] === undefined) {
      setValidationError('Please select one option before proceeding to the next question.');
      return;
    }
    setValidationError(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setValidationError(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);
    setErrorMsg(null);

    const currentQ = questions[currentIndex];
    if (answers[currentQ.id] === undefined) {
      setValidationError('Please select an answer for the final question before submitting.');
      return;
    }

    const totalAnswered = Object.keys(answers).length;
    if (totalAnswered < questions.length) {
      setValidationError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitDiscoveryAnswers(answers);
      if (response && response.success && response.result) {
        setDiscoveryResult(response.result);
        setViewingResult(true);
      } else {
        setErrorMsg('Failed to calculate discovery result. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Career Discovery submission failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeDiscovery = () => {
    setAnswers({});
    setCurrentIndex(0);
    setValidationError(null);
    setErrorMsg(null);
    setViewingResult(false);
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Loading Career Discovery questionnaire...
        </div>
      </GlassCard>
    );
  }

  // --- RESULT VIEW ---
  if (viewingResult && discoveryResult) {
    const { scores, percentages, top_areas, relevant_careers } = discoveryResult;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 900, margin: '0 auto' }}>
        {/* Header Banner */}
        <GlassCard style={{
          background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
          color: '#FFFFFF',
          padding: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={20} color="#FBBF24" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase' }}>
                  Interest Mapping Complete
                </span>
              </div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0 }}>
                Career Discovery Results
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#E2E8F0', marginTop: 8, maxWidth: 650 }}>
                Based on your preferences across 12 scenario questions, here is how your working interest is distributed across four core career areas.
              </p>
            </div>

            <button
              onClick={handleRetakeDiscovery}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 16px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <RotateCcw size={16} /> Retake Discovery
            </button>
          </div>
        </GlassCard>

        {/* 4 Core Discovery Areas Breakdown */}
        <GlassCard style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={22} color="#4F46E5" /> Interest Breakdown by Domain
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Technical / Software', score: scores?.technical || 0, pct: percentages?.technical || 0, color: '#4F46E5' },
              { label: 'Data / Analytics', score: scores?.data || 0, pct: percentages?.data || 0, color: '#059669' },
              { label: 'Design / User Experience', score: scores?.design || 0, pct: percentages?.design || 0, color: '#7C3AED' },
              { label: 'Business / Management', score: scores?.business || 0, pct: percentages?.business || 0, color: '#D97706' },
            ].map((area, idx) => (
              <div key={idx} style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '16px',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{area.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: area.color }}>{area.score}/12</span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: area.color }}>
                  {area.pct}%
                </div>

                <div style={{ background: '#E2E8F0', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${area.pct}%`,
                    height: '100%',
                    background: area.color,
                    borderRadius: 999,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Discovery Areas Section */}
        <GlassCard style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16 }}>
            Areas You May Want to Explore
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {top_areas?.slice(0, 2).map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                padding: '16px 20px',
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: '#4F46E5',
                      color: '#FFFFFF',
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      #{idx + 1}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                      {item.area}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#475569', marginTop: 6, margin: '6px 0 0 32px' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5' }}>
                    {item.percentage}%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({item.score} of 12 choices)</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#92400E',
            padding: '14px 18px',
            borderRadius: 10,
            fontSize: '0.85rem',
            marginTop: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <AlertCircle size={18} style={{ minWidth: 18, marginTop: 2 }} />
            <div>
              <strong>Note on Career Discovery:</strong> This discovery step highlights your preferred working style and interest domains. It is not your final career recommendation. Complete the detailed Skill Assessment to generate benchmark suitability scores and skill gap analyses.
            </div>
          </div>
        </GlassCard>

        {/* Relevant Careers Mapped from existing dataset */}
        <GlassCard style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={20} color="#10B981" /> Related Careers to Explore
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {relevant_careers?.map((car) => (
              <div key={car.id} style={{
                border: '1px solid #E2E8F0',
                padding: '18px',
                borderRadius: 12,
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                    {car.title}
                  </h4>
                  <span className={`glass-badge ${car.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                    {car.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, flex: 1, margin: 0 }}>
                  {car.description}
                </p>

                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Avg Salary: <strong>{car.average_salary}</strong>
                </div>

                <button
                  onClick={() => {
                    if (onSelectCareer) onSelectCareer(car.id);
                    else onNavigate('careers');
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '8px', fontSize: '0.82rem', marginTop: 4, fontWeight: 700 }}
                >
                  Explore Career →
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={() => onNavigate('assessment')}
              className="btn"
              style={{
                background: '#172554',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: 10,
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>Proceed to Skill Assessment</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- QUESTIONNAIRE QUIZ VIEW ---
  if (!questions.length) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#EF4444', fontWeight: 600 }}>No Career Discovery questions available.</div>
      </GlassCard>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
  const selectedOption = answers[currentQ.id];

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
              background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Compass size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#172554', margin: 0 }}>
                Career Discovery
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Discover the areas that match your interests and working preferences.
              </span>
            </div>
          </div>

          <span style={{
            background: 'rgba(79, 70, 229, 0.1)',
            color: '#4F46E5',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ background: '#E2E8F0', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #172554 0%, #4F46E5 100%)',
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

        {validationError && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#92400E',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: '0.88rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} color="#D97706" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Question Text */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.5, margin: 0 }}>
            {currentQ.question_text}
          </h3>
        </div>

        {/* 4 Selectable Answer Option Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {currentQ.options?.map((optText, oIdx) => {
            const isSelected = selectedOption === oIdx;
            const labels = ['Option 1 (Technical)', 'Option 2 (Data)', 'Option 3 (Design)', 'Option 4 (Business)'];

            return (
              <label
                key={oIdx}
                onClick={() => handleSelectOption(currentQ.id, oIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: isSelected ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                  background: isSelected ? 'rgba(79, 70, 229, 0.08)' : '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name={`discovery_q_${currentQ.id}`}
                  checked={isSelected}
                  onChange={() => handleSelectOption(currentQ.id, oIdx)}
                  style={{ width: 18, height: 18, accentColor: '#4F46E5', marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#172554' : '#334155', lineHeight: 1.45 }}>
                    {optText}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Navigation Buttons */}
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
                padding: '10px 22px',
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
                background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
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
              {submitting ? 'Calculating Discovery Result...' : 'Submit Career Discovery'}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
