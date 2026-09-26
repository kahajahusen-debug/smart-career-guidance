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
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Bot, 
  Loader2, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  Target,
  FileText
} from 'lucide-react';

export default function InterviewPreparationPage({ onNavigate, preselectedCareer }) {
  const [activeTab, setActiveTab] = useState('practice'); // 'practice' | 'history'
  const [careersList, setCareersList] = useState([]);
  const [userContext, setUserContext] = useState(null);

  // Setup Form State
  const [targetCareer, setTargetCareer] = useState(preselectedCareer || 'Full Stack Software Engineer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Session Active State
  const [session, setSession] = useState(null);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Status flags
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
    if (!currentAnswerText.trim() || submitting || !session) return;
    try {
      setSubmitting(true);
      setError(null);

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

  const handleNextQuestion = () => {
    setCurrentAnswerText('');
    setCurrentEvaluation(null);
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

  const isSessionActive = session && session.status === 'In Progress';
  const isSessionCompleted = session && session.status === 'Completed';

  const currentQIndex = session ? session.current_question - 1 : 0;
  // If evaluation was just done for question N, display that question details
  const displayQIndex = currentEvaluation ? currentQIndex - 1 : currentQIndex;
  const currentQuestionObj = session?.questions?.[displayQIndex] || null;

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

      {/* VIEW MODE 1: SETUP FORM */}
      {activeTab === 'practice' && !isSessionActive && !isSessionCompleted && (
        <GlassCard style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172554', marginBottom: 20 }}>
            Configure Your Mock Interview
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 28 }}>
            {/* Target Career */}
            <div>
              <label htmlFor="interview-target-career" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Target Career Pathway
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
                  outline: 'none'
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

            {/* Interview Type */}
            <div>
              <label htmlFor="interview-type" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Interview Type
              </label>
              <select
                id="interview-type"
                name="interviewType"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="Technical">Technical Interview</option>
                <option value="HR">HR Interview</option>
                <option value="Behavioral">Behavioral Interview</option>
                <option value="Mixed">Mixed Interview (Tech + HR + Behavioral)</option>
              </select>
            </div>

            {/* Difficulty */}
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
                  outline: 'none'
                }}
              >
                <option value="Beginner">Beginner (Foundations & Concepts)</option>
                <option value="Intermediate">Intermediate (Standard Industry benchmark)</option>
                <option value="Advanced">Advanced (System Design & In-depth Architecture)</option>
              </select>
            </div>

            {/* Number of Questions */}
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
                  outline: 'none'
                }}
              >
                <option value={5}>5 Questions (Quick Practice)</option>
                <option value={10}>10 Questions (Standard Mock)</option>
                <option value={15}>15 Questions (Full Assessment)</option>
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
                  <Loader2 className="animate-spin" size={18} /> Generating Dynamic Questions...
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

      {/* VIEW MODE 2: ACTIVE QUESTION SESSION */}
      {activeTab === 'practice' && isSessionActive && currentQuestionObj && (
        <GlassCard style={{ padding: '32px' }}>
          {/* Top Session Progress Bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="glass-badge badge-it">
                  {session.target_career}
                </span>
                <span className="glass-badge badge-nonit">
                  {session.interview_type} • {session.difficulty}
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#172554' }}>
                Question {displayQIndex + 1} of {session.total_questions}
              </div>
            </div>

            <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((displayQIndex + (currentEvaluation ? 1 : 0)) / session.total_questions) * 100}%`,
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
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {currentQuestionObj.type?.toUpperCase()} QUESTION
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: 0, lineHeight: 1.4 }}>
              "{currentQuestionObj.question}"
            </h3>
          </div>

          {/* EVALUATION RESULT DISPLAY (IF SUBMITTED) */}
          {currentEvaluation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {/* Score Header */}
              <div style={{
                background: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: 16,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#4F46E5', fontWeight: 700 }}>Your AI Answer Score</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#172554' }}>
                    {currentEvaluation.score} <span style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: 600 }}>/ 100</span>
                  </div>
                </div>

                <div style={{ flex: 1, marginLeft: 24 }}>
                  <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>Feedback:</div>
                  <div style={{ fontSize: '0.92rem', color: '#1E293B', marginTop: 4 }}>
                    {currentEvaluation.feedback}
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px 20px', borderRadius: 12 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> Strengths Demonstrated
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem', color: '#166534' }}>
                    {currentEvaluation.strengths?.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '16px 20px', borderRadius: 12 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#B91C1C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={16} /> Areas to Improve
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem', color: '#991B1B' }}>
                    {currentEvaluation.improvements?.map((imp, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Answer Box */}
              {currentEvaluation.model_answer && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: 12 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', marginBottom: 6 }}>
                    Recommended Model Answer Benchmark
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                    {currentEvaluation.model_answer}
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button
                  onClick={handleNextQuestion}
                  className="btn"
                  style={{
                    background: '#172554',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {displayQIndex + 1 < session.total_questions ? 'Next Question' : 'View Final Summary'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* ANSWER INPUT FORM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label htmlFor="interview-answer" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                Your Answer:
              </label>
              <textarea
                id="interview-answer"
                name="answer"
                value={currentAnswerText}
                onChange={(e) => setCurrentAnswerText(e.target.value)}
                placeholder="Type your structured answer here... (Tip: Explain key definitions, trade-offs, and practical examples)"
                rows={7}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {currentAnswerText.split(/\s+/).filter(Boolean).length} words
                </div>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !currentAnswerText.trim()}
                  className="btn"
                  style={{
                    background: submitting || !currentAnswerText.trim() ? '#94A3B8' : '#172554',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: submitting || !currentAnswerText.trim() ? 'not-allowed' : 'pointer'
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

      {/* VIEW MODE 3: SESSION COMPLETED SUMMARY */}
      {activeTab === 'practice' && isSessionCompleted && (
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Award size={32} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#172554', margin: 0 }}>
              Interview Complete!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: 6 }}>
              Great job finishing your mock interview for <strong>{session.target_career}</strong>.
            </p>
          </div>

          {/* Overall Score Badge */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.05) 0%, rgba(79, 70, 229, 0.08) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            borderRadius: 20,
            padding: '24px',
            textAlign: 'center',
            marginBottom: 28
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>
              Overall Performance Score
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#172554', lineHeight: 1.1, marginTop: 4 }}>
              {session.overall_score !== null ? `${session.overall_score}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#047857', marginTop: 6 }}>
              Performance Tier: {session.performance_summary?.performance_tier || 'Good'}
            </div>
          </div>

          {/* Summary Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '20px', borderRadius: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803D', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={18} /> Top Demonstrated Strengths
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.9rem', color: '#166534' }}>
                {session.performance_summary?.strengths?.map((s, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '20px', borderRadius: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#B91C1C', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={18} /> Priority Areas to Improve
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.9rem', color: '#991B1B' }}>
                {session.performance_summary?.improvements?.map((imp, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Topics Connected to Phase 6 Skill Gaps */}
          {session.performance_summary?.recommended_topics?.length > 0 && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: 16, marginBottom: 28 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#172554', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} /> Recommended Focus Topics (Phase 6 Action Plan Integration)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {session.performance_summary.recommended_topics.map((topic, idx) => (
                  <span key={idx} className="glass-badge badge-it">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSession(null);
                setCurrentAnswerText('');
                setCurrentEvaluation(null);
              }}
              className="btn"
              style={{
                background: '#172554',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <RotateCcw size={16} /> Practice Again
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="btn btn-outline"
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Bot size={16} /> Back to AI Career Assistant
            </button>
          </div>
        </GlassCard>
      )}

      {/* VIEW MODE 4: INTERVIEW HISTORY TAB */}
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
              <FileText size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
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
                      <span className="glass-badge badge-nonit">{hSess.interview_type} • {hSess.difficulty}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                      Started: {new Date(hSess.started_at).toLocaleDateString()} • {hSess.total_questions} Questions
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Overall Score</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#172554' }}>
                        {hSess.overall_score !== null ? `${hSess.overall_score}%` : 'In Progress'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSession(hSess);
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
                      View Details
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
