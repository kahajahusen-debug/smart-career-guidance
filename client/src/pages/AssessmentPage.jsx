import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { fetchQuestions, submitAssessment } from '../services/api';
import { HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AssessmentPage({ user, onAssessmentSubmitted }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: selected_option_index }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetchQuestions('all');
      const qList = res.questions || [];
      // Select 10 questions covering IT & Non-IT across skills
      const selectedQuiz = qList.slice(0, 10);
      setQuestions(selectedQuiz);
    } catch (err) {
      setErrorMsg('Failed to load assessment questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    // Check answered count
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      setErrorMsg(`Please answer all ${questions.length} questions before submitting. (${answeredCount}/${questions.length} answered)`);
      return;
    }

    try {
      setSubmitting(true);
      const result = await submitAssessment(answers);
      if (onAssessmentSubmitted) {
        onAssessmentSubmitted(result);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Assessment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#64748B', fontWeight: 600 }}>Preparing assessment questions...</div>
      </GlassCard>
    );
  }

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
    <div style={{ maxWidth: 720, margin: '20px auto' }}>
      <GlassCard style={{ padding: '36px' }}>
        {/* Quiz Header */}
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
                Smart Career Assessment
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Question {currentIndex + 1} of {questions.length} ({totalAnswered} Answered)
              </span>
            </div>
          </div>

          <span style={{
            background: 'rgba(124, 58, 237, 0.1)',
            color: '#7C3AED',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            Skill: {currentQ.skill_name} (Diff: {currentQ.difficulty}/5)
          </span>
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
                fontWeight: 700
              }}
            >
              Next <ChevronRight size={16} />
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
              {submitting ? 'Calculating Recommendations...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
