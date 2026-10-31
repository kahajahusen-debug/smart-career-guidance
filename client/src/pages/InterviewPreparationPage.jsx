import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { 
  startInterviewSession, 
  submitInterviewAnswer, 
  getInterviewSession, 
  getInterviewHistory, 
  clearInterviewHistory,
  fetchCareers,
  getAssistantContext
} from '../services/api';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  LayoutDashboard,
  Bot, 
  Loader2, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  Target,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function InterviewPreparationPage({ onNavigate, preselectedCareer }) {
  const [activeTab, setActiveTab] = useState('practice'); // 'practice' | 'history'
  const [careersList, setCareersList] = useState([]);
  const [userContext, setUserContext] = useState(null);

  // Setup Form State
  const [targetCareer, setTargetCareer] = useState(preselectedCareer || 'Full Stack Software Engineer');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [interviewType, setInterviewType] = useState('Technical');

  // Active Session State
  const [session, setSession] = useState(null);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [reviewedQuestionIndex, setReviewedQuestionIndex] = useState(null);
  const [showFinalReview, setShowFinalReview] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Status Flags
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cRes, ctxRes, histRes] = await Promise.all([
        fetchCareers('all').catch(() => ({ careers: [] })),
        getAssistantContext().catch(() => ({ context: null })),
        getInterviewHistory().catch(() => ({ history: [] }))
      ]);

      if (cRes?.careers) setCareersList(cRes.careers);
      if (ctxRes?.context) {
        setUserContext(ctxRes.context);
        if (!preselectedCareer && ctxRes.context.target_career) {
          setTargetCareer(ctxRes.context.target_career);
        }
      }
      if (histRes?.history) setHistory(histRes.history);
    } catch (err) {
      console.error('Error loading interview prep initial data:', err);
      setError('Failed to initialize interview prep module.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      setStarting(true);
      setError(null);
      setCurrentAnswerText('');
      setCurrentEvaluation(null);
      setReviewedQuestionIndex(null);
      setShowFinalReview(false);

      const res = await startInterviewSession({
        target_career: targetCareer,
        interview_type: interviewType,
        difficulty: difficulty,
        total_questions: totalQuestions
      });

      if (res && res.success && res.session) {
        setSession(res.session);
      } else {
        throw new Error(res?.detail || 'Failed to start interview session');
      }
    } catch (err) {
      console.error('Error starting interview session:', err);
      setError('Unable to start interview session. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (submitting || !session) return;
    try {
      setSubmitting(true);
      setError(null);

      // Record which question index was just evaluated
      const answeringIndex = session.current_question - 1;
      setReviewedQuestionIndex(answeringIndex);

      const res = await submitInterviewAnswer(session.session_id, currentAnswerText.trim());
      if (res && res.success && res.evaluation && res.session) {
        setCurrentEvaluation(res.evaluation);
        setSession(res.session);
      } else {
        throw new Error(res?.detail || 'Failed to evaluate answer');
      }
    } catch (err) {
      console.error('Error submitting interview answer:', err);
      setError('Could not evaluate answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    // Clear evaluation and input to move to next question or final summary
    setCurrentEvaluation(null);
    setCurrentAnswerText('');
    setReviewedQuestionIndex(null);
  };

  const handleRetakeInterview = () => {
    setSession(null);
    setCurrentAnswerText('');
    setCurrentEvaluation(null);
    setReviewedQuestionIndex(null);
    setShowFinalReview(false);
    setError(null);
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your interview history?')) return;
    try {
      await clearInterviewHistory();
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#4F46E5', margin: '0 auto 16px' }} />
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Loading Interview Preparation Module...
        </div>
      </GlassCard>
    );
  }

  // Session state checks
  // If currentEvaluation is present, user is reviewing the question they just submitted.
  // The session is only considered finished from the user's perspective once they click Continue on the last question.
  const isReviewingSubmittedAnswer = currentEvaluation !== null;
  const isSessionActive = session && (session.status === 'In Progress' || isReviewingSubmittedAnswer);
  const isSessionCompleted = session && session.status === 'Completed' && !isReviewingSubmittedAnswer;

  // Question index being shown
  const currentQIndex = isReviewingSubmittedAnswer && reviewedQuestionIndex !== null
    ? reviewedQuestionIndex
    : (session ? session.current_question - 1 : 0);

  const currentQuestionObj = session?.questions?.[currentQIndex] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '28px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="glass-badge badge-it" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} /> AI Mock Interviewer
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              Interview Preparation
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#E2E8F0', marginTop: 6, maxWidth: 650 }}>
              Practice career-specific interview questions, receive instant AI evaluations, and track your scoring progress.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActiveTab('practice')}
              className="btn"
              style={{
                background: activeTab === 'practice' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'practice' ? '#172554' : '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              Practice Session
            </button>
            <button
              onClick={async () => {
                setActiveTab('history');
                const hRes = await getInterviewHistory().catch(() => ({ history: [] }));
                if (hRes?.history) setHistory(hRes.history);
              }}
              className="btn"
              style={{
                background: activeTab === 'history' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'history' ? '#172554' : '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              Interview History ({history.length})
            </button>
          </div>
        </div>
      </GlassCard>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#B91C1C',
          padding: '12px 20px',
          borderRadius: 12,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* VIEW 1: INTERVIEW SETUP */}
      {activeTab === 'practice' && !isSessionActive && !isSessionCompleted && (
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Start Interview Practice
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 4 }}>
              Select your career track, difficulty, and question count to begin.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 28 }}>
            {/* Target Career Selection */}
            <div>
              <label htmlFor="interview-target-career" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Target Career Role
              </label>
              <select
                id="interview-target-career"
                name="targetCareer"
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#1E293B',
                  fontWeight: 500
                }}
              >
                {careersList.length > 0 ? (
                  careersList.map(c => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))
                ) : (
                  <>
                    <option value="Full Stack Software Engineer">Full Stack Software Engineer</option>
                    <option value="Data Scientist & ML Engineer">Data Scientist & ML Engineer</option>
                    <option value="Digital Marketing & Analytics Strategist">Digital Marketing & Analytics Strategist</option>
                    <option value="UI/UX Product Designer">UI/UX Product Designer</option>
                  </>
                )}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label htmlFor="interview-difficulty" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Difficulty Level
              </label>
              <select
                id="interview-difficulty"
                name="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#1E293B',
                  fontWeight: 500
                }}
              >
                <option value="Beginner">Beginner (Foundations & Core Concepts)</option>
                <option value="Intermediate">Intermediate (Standard Industry Interview)</option>
                <option value="Advanced">Advanced (System Architecture & In-Depth)</option>
              </select>
            </div>

            {/* Number of Questions Selection (5, 10, 15) */}
            <div>
              <label htmlFor="interview-total-questions" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Number of Questions
              </label>
              <select
                id="interview-total-questions"
                name="totalQuestions"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#1E293B',
                  fontWeight: 600
                }}
              >
                <option value={5}>5 Questions — Final score out of 5</option>
                <option value={10}>10 Questions — Final score out of 10</option>
                <option value={15}>15 Questions — Final score out of 15</option>
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              onClick={handleStartInterview}
              disabled={starting}
              className="btn"
              style={{
                background: starting ? '#94A3B8' : '#172554',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: starting ? 'not-allowed' : 'pointer'
              }}
            >
              {starting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Preparing Questions...
                </>
              ) : (
                <>
                  Start Interview <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </GlassCard>
      )}

      {/* VIEW 2: QUESTION & EVALUATION INTERFACE (ONE QUESTION AT A TIME) */}
      {activeTab === 'practice' && isSessionActive && currentQuestionObj && (
        <GlassCard style={{ padding: '32px' }}>
          {/* Header Metadata & Progress Bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="glass-badge badge-it" style={{ fontWeight: 700 }}>
                  {session.target_career}
                </span>
                <span className="glass-badge badge-nonit" style={{ fontWeight: 700 }}>
                  {session.difficulty}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#172554' }}>
                Question {currentQIndex + 1} of {session.total_questions}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((currentQIndex + (isReviewingSubmittedAnswer ? 1 : 0)) / session.total_questions) * 100}%`,
                background: 'linear-gradient(90deg, #172554 0%, #4F46E5 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Question Text Box */}
          <div style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
            border: '1px solid #C7D2FE',
            padding: '24px',
            borderRadius: 16,
            marginBottom: 24
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Interview Question
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0, lineHeight: 1.45 }}>
              "{currentQuestionObj.question}"
            </h3>
          </div>

          {/* STATE A: EVALUATION RESULT DISPLAY (AFTER SUBMISSION) */}
          {currentEvaluation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Result Status & Score Banner */}
              <div style={{
                background: currentEvaluation.status === 'Correct'
                  ? 'rgba(22, 163, 74, 0.08)'
                  : currentEvaluation.status === 'Partially Correct'
                  ? 'rgba(217, 119, 6, 0.08)'
                  : 'rgba(220, 38, 38, 0.08)',
                border: `1px solid ${
                  currentEvaluation.status === 'Correct'
                    ? '#BBF7D0'
                    : currentEvaluation.status === 'Partially Correct'
                    ? '#FDE68A'
                    : '#FECACA'
                }`,
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {currentEvaluation.status === 'Correct' ? (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={26} />
                    </div>
                  ) : currentEvaluation.status === 'Partially Correct' ? (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={26} />
                    </div>
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <XCircle size={26} />
                    </div>
                  )}

                  <div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: currentEvaluation.status === 'Correct'
                        ? '#15803D'
                        : currentEvaluation.status === 'Partially Correct'
                        ? '#B45309'
                        : '#B91C1C'
                    }}>
                      {currentEvaluation.status}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                      Score earned: <strong>{currentEvaluation.score === 1 ? '1 point' : currentEvaluation.score === 0.5 ? '0.5 points' : '0 points'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: currentEvaluation.status === 'Correct'
                    ? '#15803D'
                    : currentEvaluation.status === 'Partially Correct'
                    ? '#B45309'
                    : '#B91C1C'
                }}>
                  +{currentEvaluation.score} pt
                </div>
              </div>

              {/* Short, Relevant Feedback */}
              {currentEvaluation.feedback && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '18px 20px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', marginBottom: 4 }}>
                    Feedback
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#1E293B', lineHeight: 1.5 }}>
                    {currentEvaluation.feedback}
                  </div>
                </div>
              )}

              {/* Important Missing Points (if any) */}
              {currentEvaluation.missing_points && currentEvaluation.missing_points.length > 0 && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 14,
                  padding: '18px 20px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={15} /> Important Missing Points
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: '#991B1B', lineHeight: 1.5 }}>
                    {currentEvaluation.missing_points.map((pt, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concise Expected Answer */}
              {(currentEvaluation.expected_answer || currentEvaluation.model_answer) && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 14,
                  padding: '18px 20px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={15} /> Concise Expected Answer
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#166534', lineHeight: 1.55 }}>
                    {currentEvaluation.expected_answer || currentEvaluation.model_answer}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button
                  onClick={handleContinue}
                  className="btn"
                  style={{
                    background: '#172554',
                    color: '#FFFFFF',
                    padding: '12px 28px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  {currentQIndex + 1 < session.total_questions ? (
                    <>
                      Continue to Next Question <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Continue to Final Score <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STATE B: ANSWER INPUT FORM (ONE QUESTION AT A TIME) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label htmlFor="interview-answer" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                Your Answer:
              </label>
              <textarea
                id="interview-answer"
                name="answer"
                value={currentAnswerText}
                onChange={(e) => setCurrentAnswerText(e.target.value)}
                placeholder="Type your answer here... Explain key concepts, definitions, and practical mechanisms directly."
                rows={7}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  outline: 'none',
                  color: '#1E293B',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {currentAnswerText.split(/\s+/).filter(Boolean).length} words
                </div>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting}
                  className="btn"
                  style={{
                    background: submitting ? '#94A3B8' : '#172554',
                    color: '#FFFFFF',
                    padding: '12px 28px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Evaluating Answer...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* VIEW 3: FINAL SCORE & PERFORMANCE SUMMARY */}
      {activeTab === 'practice' && isSessionCompleted && (
        <GlassCard style={{ padding: '36px' }}>
          {/* Header Completion Title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)'
            }}>
              <Award size={34} />
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#172554', margin: 0 }}>
              Interview Completed!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: 6 }}>
              Target Role: <strong>{session.target_career}</strong> • {session.difficulty}
            </p>
          </div>

          {/* Dynamic Final Score Hero Display */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.04) 0%, rgba(79, 70, 229, 0.08) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            borderRadius: 20,
            padding: '28px',
            textAlign: 'center',
            marginBottom: 28
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Score
            </div>
            <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#172554', lineHeight: 1.1, marginTop: 4 }}>
              {session.total_score !== undefined ? session.total_score : session.overall_score}
              <span style={{ fontSize: '1.8rem', color: '#64748B', fontWeight: 600 }}> / {session.total_questions}</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4F46E5', marginTop: 4 }}>
              {session.percentage !== undefined ? `${session.percentage}%` : `${session.overall_score}%`}
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: 10,
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: '0.88rem',
              fontWeight: 800,
              background: (session.percentage || 0) >= 80 ? '#DCFCE7' : (session.percentage || 0) >= 60 ? '#FEF3C7' : '#FEE2E2',
              color: (session.percentage || 0) >= 80 ? '#15803D' : (session.percentage || 0) >= 60 ? '#B45309' : '#B91C1C'
            }}>
              Overall Performance: {session.performance_summary?.performance_tier || 'Good'}
            </div>
            {session.performance_summary?.overall_performance && (
              <p style={{ fontSize: '0.92rem', color: '#334155', maxWidth: 620, margin: '12px auto 0', lineHeight: 1.5 }}>
                {session.performance_summary.overall_performance}
              </p>
            )}
          </div>

          {/* Breakdown Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Correct</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803D', marginTop: 2 }}>
                {session.correct_count ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534' }}>1 pt each</div>
            </div>

            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '16px', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Partially Correct</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#B45309', marginTop: 2 }}>
                {session.partially_correct_count ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400E' }}>0.5 pts each</div>
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '16px', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase' }}>Incorrect</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#B91C1C', marginTop: 2 }}>
                {session.incorrect_count ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991B1B' }}>0 pts each</div>
            </div>

            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '16px', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>Total Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#172554', marginTop: 2 }}>
                {session.score_display || `${session.total_score}/${session.total_questions}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4338CA' }}>{session.percentage}%</div>
            </div>
          </div>

          {/* Areas to Improve */}
          {session.performance_summary?.areas_to_improve && session.performance_summary.areas_to_improve.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} /> Key Areas to Improve
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.92rem', color: '#991B1B', lineHeight: 1.6 }}>
                {session.performance_summary.areas_to_improve.map((area, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons: Review Answers | Retake Interview | Back to Dashboard */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: showFinalReview ? 28 : 0 }}>
            <button
              onClick={() => setShowFinalReview(!showFinalReview)}
              className="btn btn-outline"
              style={{
                padding: '12px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FileText size={16} /> {showFinalReview ? 'Hide Answer Review' : 'Review Answers'}
              {showFinalReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              onClick={handleRetakeInterview}
              className="btn"
              style={{
                background: '#172554',
                color: '#FFFFFF',
                padding: '12px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <RotateCcw size={16} /> Retake Interview
            </button>

            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="btn btn-outline"
              style={{
                padding: '12px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <LayoutDashboard size={16} /> Back to Dashboard
            </button>
          </div>

          {/* REVIEW ANSWERS EXPANDABLE SECTION */}
          {showFinalReview && (
            <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: '0 0 8px' }}>
                Question-by-Question Review
              </h3>
              {session.questions?.map((q, idx) => (
                <div
                  key={q.question_id || idx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
                      Question {idx + 1} of {session.total_questions}
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      background: q.status === 'Correct' ? '#DCFCE7' : q.status === 'Partially Correct' ? '#FEF3C7' : '#FEE2E2',
                      color: q.status === 'Correct' ? '#15803D' : q.status === 'Partially Correct' ? '#B45309' : '#B91C1C'
                    }}>
                      {q.status || 'Scored'} • {q.score !== null ? `${q.score} pt` : '0 pt'}
                    </span>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#172554', marginBottom: 12 }}>
                    "{q.question}"
                  </div>

                  {/* Submitted Answer */}
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 2 }}>
                    Your Answer:
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: q.answer ? '#1E293B' : '#94A3B8',
                    fontStyle: q.answer ? 'normal' : 'italic',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginBottom: 10
                  }}>
                    {q.answer || '(No answer provided)'}
                  </div>

                  {/* Feedback */}
                  {q.feedback && (
                    <div style={{ fontSize: '0.88rem', color: '#334155', marginBottom: 8 }}>
                      <strong>Feedback:</strong> {q.feedback}
                    </div>
                  )}

                  {/* Missing points if any */}
                  {q.missing_points && q.missing_points.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#B91C1C', marginBottom: 8 }}>
                      <strong>Missing Points:</strong> {q.missing_points.join('; ')}
                    </div>
                  )}

                  {/* Expected Answer */}
                  {(q.expected_answer || q.model_answer) && (
                    <div style={{ fontSize: '0.86rem', color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px' }}>
                      <strong>Expected Answer:</strong> {q.expected_answer || q.model_answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* VIEW 4: INTERVIEW HISTORY TAB */}
      {activeTab === 'history' && (
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Your Interview Practice History
            </h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#DC2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <FileText size={40} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>No interview history found</div>
              <p style={{ fontSize: '0.88rem', marginTop: 4 }}>Complete a mock interview session to view your progress analytics here.</p>
              <button
                onClick={() => setActiveTab('practice')}
                className="btn"
                style={{
                  marginTop: 12,
                  background: '#172554',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                Start First Mock Interview
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {history.map((hSess) => (
                <div
                  key={hSess.session_id}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="glass-badge badge-it">{hSess.target_career}</span>
                      <span className="glass-badge badge-nonit">{hSess.difficulty}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                      Started: {new Date(hSess.started_at).toLocaleDateString()} • {hSess.total_questions} Questions
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Score</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#172554' }}>
                        {hSess.score_display || (hSess.total_score !== undefined ? `${hSess.total_score}/${hSess.total_questions}` : `${hSess.overall_score}%`)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSession(hSess);
                        setCurrentEvaluation(null);
                        setReviewedQuestionIndex(null);
                        setShowFinalReview(true);
                        setActiveTab('practice');
                      }}
                      className="btn btn-outline"
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
