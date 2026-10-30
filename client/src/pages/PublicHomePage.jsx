import React, { useState } from 'react';
import PublicNavbar from '../components/public/PublicNavbar';
import PublicFooter from '../components/public/PublicFooter';
import heroStudentImg from '../assets/hero-student.png';
import {
  Compass,
  BarChart3,
  Sparkles,
  Route,
  Bot,
  Briefcase,
  ArrowRight,
  UserPlus,
  Search,
  Target,
  Rocket,
  CheckCircle2,
  X
} from 'lucide-react';

export default function PublicHomePage({ onNavigate }) {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const featureCards = [
    {
      id: 'discovery',
      title: 'Career Discovery',
      description: 'Explore career options and discover careers matching your interests and skills.',
      icon: Compass,
      bgColor: '#EEF2FF',
      iconColor: '#4F46E5',
      details: 'Analyze both IT and Non-IT career options with real salary ranges, required core skills, growth projections, and day-to-day responsibilities tailored to your unique profile.',
      highlights: ['50+ curated job roles indexed', 'IT & Non-IT career streams', 'Labor market demand insights']
    },
    {
      id: 'assessment',
      title: 'Skill Assessment',
      description: 'Evaluate your current skills and identify areas for improvement.',
      icon: BarChart3,
      bgColor: '#EFF6FF',
      iconColor: '#2563EB',
      details: 'Take targeted technical and domain assessments to measure your practical knowledge, identify exact skill gaps, and benchmark your readiness against industry standards.',
      highlights: ['Interactive MCQs & scenario tests', 'Real-time scoring & accuracy breakdown', 'Identify critical growth gaps']
    },
    {
      id: 'recommendations',
      title: 'Career Recommendations',
      description: 'Get personalized career suggestions based on your profile and performance.',
      icon: Sparkles,
      bgColor: '#FAF5FF',
      iconColor: '#8B5CF6',
      details: 'Receive intelligent career matches derived from your background, education, assessment score, and personal interests with explainable match percentages.',
      highlights: ['AI-driven match scoring', 'Explainable rationale for every match', 'One-click target career lock-in']
    },
    {
      id: 'action-plan',
      title: 'Career Action Plan',
      description: 'Receive a step-by-step roadmap to achieve your career goals.',
      icon: Route,
      bgColor: '#ECFDF5',
      iconColor: '#059669',
      details: 'Turn your career ambition into reality with a phased learning roadmap complete with recommended portfolio projects, certifications, and measurable milestones.',
      highlights: ['Phase-by-phase learning milestones', 'Curated portfolio projects with guides', 'Progress tracking and checklist']
    },
    {
      id: 'assistant',
      title: 'AI Career Assistant',
      description: 'Get guidance, answers, and support through an AI-powered assistant.',
      icon: Bot,
      bgColor: '#EFF6FF',
      iconColor: '#3B82F6',
      details: 'Ask questions anytime to your 24/7 intelligent career mentor. Get instant resume advice, interview tips, skill learning paths, and personalized guidance.',
      highlights: ['Instant responses grounded in career data', 'Context-aware guidance for your profile', 'Pre-crafted career conversation starters']
    },
    {
      id: 'interview',
      title: 'Interview Preparation',
      description: 'Practice interview questions and improve your confidence.',
      icon: Briefcase,
      bgColor: '#EEF2FF',
      iconColor: '#6366F1',
      details: 'Master your interviews with role-specific behavioral, technical, and scenario-based interview questions with sample high-impact answers and pro tips.',
      highlights: ['Role-specific question banks', 'Sample model answers & frameworks', 'Confidence-building practice sessions']
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
      color: '#0F172A',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* 1. Header / Navigation Bar */}
      <PublicNavbar onNavigate={onNavigate} />

      <main style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        {/* 2. Hero Section */}
        <section id="home" style={{
          position: 'relative',
          padding: '48px 24px 64px',
          background: 'radial-gradient(ellipse at 15% 30%, #EEF2FF 0%, rgba(238, 242, 255, 0.4) 40%, #FFFFFF 70%), radial-gradient(ellipse at 85% 40%, #F0F7FF 0%, #EEF2FF 35%, #FFFFFF 75%)',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: 48
          }}>
            {/* Left Hero Content */}
            <div style={{ maxWidth: 580 }}>
              {/* Badge */}
              <div style={{ marginBottom: 20 }}>
                <span className="hero-badge-pill">
                  <span style={{ fontSize: '0.9rem' }}>✦</span>
                  <span>AI-Powered Career Guidance</span>
                </span>
              </div>

              {/* Main Heading */}
              <h1 style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                marginBottom: 22
              }}>
                <div>Discover. Learn.</div>
                <div style={{ color: '#4F46E5' }}>Grow.</div>
              </h1>

              {/* Supporting Text */}
              <p style={{
                fontSize: '1.08rem',
                color: '#64748B',
                lineHeight: 1.65,
                marginBottom: 32,
                maxWidth: 490
              }}>
                Your personalized career companion for a brighter future. Get expert guidance, build in-demand skills, and achieve your dreams.
              </p>

              {/* Hero Action Button: Get Started */}
              <div>
                <button
                  onClick={() => onNavigate && onNavigate('signup')}
                  style={{
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 6px 18px -2px rgba(79, 70, 229, 0.35)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4338CA';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#4F46E5';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>Get Started</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>

            {/* Right Hero Visual (Student Photo & Floating Card) */}
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {/* Organic Soft Lavender Backdrop Shape */}
              <div style={{
                position: 'absolute',
                width: '108%',
                height: '108%',
                background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(224, 231, 255, 0.5) 100%)',
                borderRadius: '54% 46% 62% 38% / 45% 58% 42% 55%',
                filter: 'blur(10px)',
                zIndex: 0
              }} />

              {/* The Student Photograph from Reference Design */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: 530,
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(23, 37, 84, 0.12)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}>
                <img
                  src={heroStudentImg}
                  alt="Student working on laptop with Smart Career Guidance"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Floating Message Card */}
              <div
                className="animate-float"
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '10px',
                  zIndex: 2,
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '14px 20px',
                  boxShadow: '0 16px 36px -8px rgba(79, 70, 229, 0.18), 0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #EEF2FF',
                  maxWidth: 210,
                  transform: 'rotate(-3deg)'
                }}
              >
                {/* 3 Small doodle rays on top left */}
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: 14,
                  display: 'flex',
                  gap: 3,
                  color: '#4F46E5',
                  fontSize: '0.8rem',
                  fontWeight: 900
                }}>
                  <span>\</span>
                  <span style={{ transform: 'rotate(5deg)' }}>|</span>
                  <span>/</span>
                </div>

                <div className="font-handwriting" style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#172554',
                  lineHeight: 1.25
                }}>
                  Better Skills<br />
                  Better Opportunities<br />
                  A Brighter Future
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Features Section */}
        <section id="features" style={{
          padding: '80px 24px',
          maxWidth: 1240,
          margin: '0 auto'
        }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <div style={{ marginBottom: 14 }}>
              <span className="hero-badge-pill">
                <span>✦</span>
                <span>Why Choose Us?</span>
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              marginBottom: 16
            }}>
              Powerful Features for Your Career Growth
            </h2>

            <p style={{
              fontSize: '1.05rem',
              color: '#64748B',
              maxWidth: 680,
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Everything you need to discover your potential, build your skills, and achieve your goals — all in one place.
            </p>
          </div>

          {/* 6 Feature Cards in Responsive 3-Column Desktop Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24
          }}>
            {featureCards.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="public-feature-card"
                  style={{
                    padding: '30px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 210,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedFeature(feat)}
                >
                  <div>
                    {/* Icon & Title */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      marginBottom: 16
                    }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: feat.bgColor,
                        color: feat.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={24} />
                      </div>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: 1.25
                      }}>
                        {feat.title}
                      </h3>
                    </div>

                    {/* Short Description */}
                    <p style={{
                      fontSize: '0.94rem',
                      color: '#64748B',
                      lineHeight: 1.55,
                      marginBottom: 20
                    }}>
                      {feat.description}
                    </p>
                  </div>

                  {/* Bottom Action Arrow */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  }}>
                    <button
                      className="feature-arrow-btn"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#EEF2FF',
                        border: 'none',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      aria-label={`Learn more about ${feat.title}`}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. How It Works Section */}
        <section id="how-it-works" style={{
          padding: '80px 24px',
          background: 'linear-gradient(180deg, #F0F7FF 0%, #EEF2FF 100%)',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          position: 'relative'
        }}>
          <div style={{
            maxWidth: 1240,
            margin: '0 auto',
            position: 'relative'
          }}>
            {/* Top-Right Playful Annotation */}
            <div className="font-handwriting" style={{
              position: 'absolute',
              top: 0,
              right: 20,
              textAlign: 'center',
              color: '#475569',
              transform: 'rotate(6deg)',
              userSelect: 'none'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>Small steps</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>Big dreams</div>
              <div style={{ fontSize: '1.3rem', color: '#818CF8' }}>~ ♡</div>
            </div>

            {/* Section Header */}
            <div style={{ marginBottom: 54 }}>
              <div style={{ marginBottom: 14 }}>
                <span className="hero-badge-pill" style={{ background: '#FFFFFF', borderColor: '#CBD5E1' }}>
                  <span>✦</span>
                  <span>Simple Steps</span>
                </span>
              </div>

              <h2 style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                marginBottom: 12
              }}>
                How It Works
              </h2>

              <p style={{
                fontSize: '1.05rem',
                color: '#64748B',
                maxWidth: 620,
                lineHeight: 1.6
              }}>
                Your journey to a better career is simple and straightforward.
              </p>
            </div>

            {/* Four Horizontal Steps */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Step 1 */}
              <div className="step-item" style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '28px 22px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 4px 14px -3px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={26} />
                </div>
                <h4 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                  1. Sign Up
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
                  Create your account in minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="step-item" style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '28px 22px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 4px 14px -3px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Search size={26} />
                </div>
                <h4 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                  2. Explore
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
                  Discover your interests and skills.
                </p>
              </div>

              {/* Step 3 */}
              <div className="step-item" style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '28px 22px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 4px 14px -3px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Target size={26} />
                </div>
                <h4 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                  3. Get Guidance
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
                  Receive personalized recommendations.
                </p>
              </div>

              {/* Step 4 */}
              <div className="step-item" style={{
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '28px 22px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 4px 14px -3px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Rocket size={26} />
                </div>
                <h4 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                  4. Achieve
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.5 }}>
                  Build your skills and reach your goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. About Section */}
        <section id="about" style={{
          padding: '80px 24px 96px',
          maxWidth: 960,
          margin: '0 auto'
        }}>
          <div style={{ marginBottom: 14 }}>
            <span className="hero-badge-pill">
              <span>✦</span>
              <span>About Our Platform</span>
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginBottom: 20
          }}>
            Guiding Every Learner Toward Meaningful & In-Demand Careers
          </h2>

          <p style={{
            fontSize: '1.02rem',
            color: '#64748B',
            lineHeight: 1.7,
            marginBottom: 28
          }}>
            The Smart Career Guidance System bridges the gap between traditional education and dynamic industry requirements. By combining labor-market analytics, interactive skill assessments, and AI-driven recommendations, we equip candidates with clarity and actionable learning roadmaps.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Comprehensive coverage of both IT and Non-IT career streams',
              'Scientific skill benchmarking with instant diagnostic feedback',
              'Phased, milestone-driven action plans with hands-on portfolio projects',
              '24/7 AI Career Assistant tailored to your background and aspirations'
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: '#059669', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <span style={{ fontSize: '0.94rem', fontWeight: 600, color: '#334155' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 6. Clean Dark Navy Footer */}
      <PublicFooter onNavigate={onNavigate} />

      {/* Interactive Modal: Feature Details */}
      {selectedFeature && (
        <div className="modal-overlay" onClick={() => setSelectedFeature(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 580,
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: selectedFeature.bgColor,
                  color: selectedFeature.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <selectedFeature.icon size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedFeature.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Feature Overview</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedFeature(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.98rem', color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
              {selectedFeature.details}
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              marginBottom: 24
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>
                Key Capabilities
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedFeature.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#0F172A' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedFeature(null)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                onClick={() => {
                  setSelectedFeature(null);
                  if (onNavigate) onNavigate('signup');
                }}
                style={{
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
