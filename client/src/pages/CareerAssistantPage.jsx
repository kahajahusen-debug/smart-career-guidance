import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getAssistantContext, sendAssistantMessage, getAssistantHistory, clearAssistantHistory } from '../services/api';
import { 
  Bot, 
  User, 
  Send, 
  Trash2, 
  Sparkles, 
  Target, 
  Layers, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Briefcase,
  ArrowRight
} from 'lucide-react';

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '10px 0', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', color: '#F8FAFC', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', padding: '6px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
        <span>{lang ? lang.toUpperCase() : 'CODE'}</span>
        <button 
          onClick={handleCopy}
          style={{ background: 'transparent', border: 'none', color: copied ? '#34D399' : '#94A3B8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px 16px', overflowX: 'auto', fontSize: '0.88rem', fontFamily: 'Fira Code, monospace', lineHeight: 1.5 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedChatMessage({ text, isAssistant }) {
  if (!text) return null;

  const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  const chunks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    chunks.push({ type: 'code', lang: match[1] || '', code: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    chunks.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {chunks.map((chunk, cIdx) => {
        if (chunk.type === 'code') {
          return <CodeBlock key={cIdx} code={chunk.code} lang={chunk.lang} />;
        }

        const blocks = chunk.content.split(/\n\n+/);
        return (
          <React.Fragment key={cIdx}>
            {blocks.map((block, bIdx) => {
              const lines = block.split('\n').filter(l => l.trim().length > 0);
              if (lines.length === 0) return null;

              if (lines.length === 1 && lines[0].startsWith('#')) {
                const level = (lines[0].match(/^#+/) || ['#'])[0].length;
                const headerText = lines[0].replace(/^#+\s*/, '');
                return level === 1 ? (
                  <h2 key={bIdx} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#172554', margin: '4px 0 2px' }}>{renderInline(headerText)}</h2>
                ) : (
                  <h3 key={bIdx} style={{ fontSize: '1.02rem', fontWeight: 800, color: '#172554', margin: '4px 0 2px' }}>{renderInline(headerText)}</h3>
                );
              }

              const isBulletList = lines.every(l => /^[\s]*[•\-\*]\s+/.test(l));
              const isNumberedList = lines.every(l => /^[\s]*\d+[\.\)]\s+/.test(l));

              if (isBulletList) {
                return (
                  <ul key={bIdx} style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {lines.map((line, lIdx) => (
                      <li key={lIdx}>{renderInline(line.replace(/^[\s]*[•\-\*]\s+/, ''))}</li>
                    ))}
                  </ul>
                );
              }

              if (isNumberedList) {
                return (
                  <ol key={bIdx} style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {lines.map((line, lIdx) => (
                      <li key={lIdx}>{renderInline(line.replace(/^[\s]*\d+[\.\)]\s+/, ''))}</li>
                    ))}
                  </ol>
                );
              }

              return (
                <div key={bIdx} style={{ margin: 0, lineHeight: '1.55' }}>
                  {lines.map((line, lIdx) => {
                    if (line.startsWith('###')) {
                      return <h3 key={lIdx} style={{ fontSize: '1.02rem', fontWeight: 800, color: '#172554', margin: '6px 0 3px' }}>{renderInline(line.replace(/^###\s*/, ''))}</h3>;
                    }
                    return (
                      <React.Fragment key={lIdx}>
                        {renderInline(line)}
                        {lIdx < lines.length - 1 && <br />}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function NextActionCard({ nextAction }) {
  if (!nextAction) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.95) 100%)',
      borderLeft: '5px solid #4F46E5',
      borderRadius: '12px',
      padding: '16px 20px',
      marginTop: '14px',
      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4F46E5', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        <Target size={14} /> Recommended Next Action
      </div>
      <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#172554', marginBottom: 6 }}>
        Target Skill: {nextAction.skill}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
        <div>
          <span style={{ fontWeight: 700, color: '#475569' }}>Focus Area:</span> <span style={{ color: '#1E293B' }}>{nextAction.focus}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, color: '#475569' }}>Practice Task:</span> <span style={{ color: '#047857', fontWeight: 700 }}>{nextAction.practice}</span>
        </div>
      </div>
      {nextAction.after && (
        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(79, 70, 229, 0.15)' }}>
          <strong>Next Milestone:</strong> {nextAction.after}
        </div>
      )}
    </div>
  );
}

export default function CareerAssistantPage({ onNavigate, initialPrompt }) {
  const [context, setContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicQuestions, setDynamicQuestions] = useState([
    "Which skill should I learn first?",
    "Give me a 30-day learning plan",
    "Which project should I build next?",
    "How can I prepare for an interview?",
    "What should I learn this week?"
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadAssistantData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAssistantData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ctxRes, histRes] = await Promise.all([
        getAssistantContext().catch(() => ({ context: null })),
        getAssistantHistory().catch(() => ({ history: [] }))
      ]);

      if (ctxRes?.context) setContext(ctxRes.context);
      
      const loadedHistory = histRes?.history || [];
      if (loadedHistory.length > 0) {
        setMessages(loadedHistory);
      } else {
        setMessages([{
          message_id: 'welcome',
          role: 'assistant',
          message: "Hi! I'm your AI Career Assistant. How can I help you with your career today?",
          created_at: new Date().toISOString()
        }]);
      }

      if (initialPrompt) {
        handleSendMessage(initialPrompt);
      }
    } catch (err) {
      console.error('Error loading assistant context:', err);
      setError('Failed to load career assistant context. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const messageText = textToSend || inputText;
    if (!messageText || !messageText.trim() || sending) return;

    const userMessageObj = {
      message_id: `temp_user_${Date.now()}`,
      role: 'user',
      message: messageText.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessageObj]);
    if (!textToSend) setInputText('');
    setSending(true);
    setError(null);

    try {
      const res = await sendAssistantMessage(messageText.trim());
      if (res && res.success && res.message) {
        const assistantMessageObj = {
          message_id: `temp_ast_${Date.now()}`,
          role: 'assistant',
          message: res.message,
          source: res.source,
          intent: res.intent,
          next_action_card: res.next_action_card,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessageObj]);

        const sugQs = res.suggested_questions || res.dynamic_suggested_questions;
        if (sugQs && sugQs.length > 0) {
          setDynamicQuestions(sugQs);
        }

      } else {
        throw new Error(res?.detail || 'Invalid response from AI assistant');
      }
    } catch (err) {
      console.error('Error sending message to assistant:', err);
      setError('Unable to fetch response. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history?')) return;
    try {
      await clearAssistantHistory();
      setMessages([{
        message_id: 'welcome_reset',
        role: 'assistant',
        message: "Chat history cleared. How else can I assist with your career goals today?",
        created_at: new Date().toISOString()
      }]);
      setDynamicQuestions([
        "Which skill should I learn first?",
        "Give me a 30-day learning plan",
        "Which project should I build next?",
        "How can I prepare for an interview?",
        "What should I learn this week?"
      ]);
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Could not clear chat history.');
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '48px 24px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#4F46E5', margin: '0 auto 16px' }} />
        <div style={{ color: '#172554', fontWeight: 700, fontSize: '1.1rem' }}>
          Initializing AI Career Assistant...
        </div>
        <div style={{ color: '#64748B', fontSize: '0.88rem', marginTop: 6 }}>
          Syncing profile, skill gaps, action plan, and portfolio metrics...
        </div>
      </GlassCard>
    );
  }

  const targetCareer = context?.target_career || 'Software Engineer';
  const currentSkills = context?.current_skills || [];
  const skillGaps = context?.skill_gaps || [];
  const readiness = context?.portfolio_readiness !== undefined ? context.portfolio_readiness : 0;

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
                <Sparkles size={14} /> Personalized AI Guidance
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
              AI Career Assistant
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#E2E8F0', marginTop: 6, maxWidth: 650 }}>
              Get personalized career guidance based on your skills, goals, action plan and portfolio.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onNavigate('interview')}
              className="btn"
              style={{
                background: '#FFFFFF',
                color: '#172554',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Briefcase size={16} /> Practice Interview
            </button>
            <button
              onClick={handleClearHistory}
              className="btn"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FECACA',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Clear Chat History"
            >
              <Trash2 size={16} /> Clear Chat
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Personalized Context Card */}
      <GlassCard style={{ padding: '20px 24px', background: 'rgba(255, 255, 255, 0.85)' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#4F46E5', letterSpacing: '0.05em', marginBottom: 12 }}>
          Active Candidate Context
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Target Career</div>
            <div style={{ fontSize: '0.98rem', color: '#172554', fontWeight: 800, marginTop: 4 }}>
              {targetCareer}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Current Skills ({currentSkills.length})</div>
            <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 600, marginTop: 4, wordBreak: 'break-word' }}>
              {currentSkills.length > 0 ? currentSkills.join(', ') : 'None listed in profile'}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 600 }}>Skill Gaps ({skillGaps.length})</div>
            <div style={{ fontSize: '0.88rem', color: '#991B1B', fontWeight: 600, marginTop: 4, wordBreak: 'break-word' }}>
              {skillGaps.length > 0 ? skillGaps.join(', ') : 'None identified'}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Portfolio Readiness</div>
            <div style={{ fontSize: '0.98rem', color: '#047857', fontWeight: 800, marginTop: 4 }}>
              {readiness.toFixed(1)}%
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Dynamic Suggested Questions Pills */}
      <div>
        <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <HelpCircle size={14} /> Suggested Questions:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {dynamicQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={sending}
              className="btn btn-outline"
              style={{
                fontSize: '0.78rem',
                padding: '6px 12px',
                borderRadius: 20,
                background: '#FFFFFF',
                borderColor: '#CBD5E1',
                color: '#334155',
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <GlassCard style={{ padding: '24px', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#B91C1C',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: '0.85rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '520px', paddingRight: 6 }}>
          {messages.map((msg, index) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div
                key={msg.message_id || index}
                style={{
                  display: 'flex',
                  justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                  gap: 12
                }}
              >
                {isAssistant && (
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={20} />
                  </div>
                )}

                <div style={{
                  maxWidth: '82%',
                  background: isAssistant ? '#F8FAFC' : '#172554',
                  color: isAssistant ? '#1E293B' : '#FFFFFF',
                  padding: '14px 18px',
                  borderRadius: isAssistant ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  border: isAssistant ? '1px solid #E2E8F0' : 'none',
                  fontSize: '0.92rem',
                  lineHeight: 1.55
                }}>
                  <FormattedChatMessage text={msg.message} isAssistant={isAssistant} />
                  {isAssistant && msg.next_action_card && (
                    <NextActionCard nextAction={msg.next_action_card} />
                  )}
                </div>

                {!isAssistant && (
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: 'rgba(79, 70, 229, 0.15)',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={20} />
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={20} />
              </div>
              <div style={{
                background: '#F8FAFC',
                padding: '14px 18px',
                borderRadius: '4px 18px 18px 18px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#64748B',
                fontSize: '0.88rem'
              }}>
                <Loader2 className="animate-spin" size={16} /> Thinking and analyzing your career profile...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: '#F1F5F9',
            padding: 8,
            borderRadius: 16,
            border: '1px solid #CBD5E1'
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything about your career, skills, projects or interview prep..."
            disabled={sending}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '10px 14px',
              fontSize: '0.92rem',
              outline: 'none',
              color: '#1E293B'
            }}
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="btn"
            style={{
              background: sending || !inputText.trim() ? '#94A3B8' : '#172554',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: sending || !inputText.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Send <Send size={16} />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
