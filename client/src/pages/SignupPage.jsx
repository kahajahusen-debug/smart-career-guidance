import React, { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import ChipInput from '../components/common/ChipInput';
import { signupUser } from '../services/api';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Shield
} from 'lucide-react';

export default function SignupPage({ onSignupSuccess, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Account Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Career Profile
  const [educationLevel, setEducationLevel] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Student / Fresher');
  const [preferredCategory, setPreferredCategory] = useState('Undecided');
  const [currentSkills, setCurrentSkills] = useState([]);
  const [interests, setInterests] = useState([]);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick skill suggestions
  const suggestedSkills = ['Python', 'JavaScript', 'SQL', 'Data Analysis', 'Project Management', 'Java', 'React', 'Communication'];
  const suggestedInterests = ['Artificial Intelligence', 'Software Engineering', 'Data Science', 'Cloud Computing', 'Product Management', 'Cybersecurity'];

  const validateStep1 = () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setError(null);
    if (!educationLevel) {
      setError('Please select your highest education level.');
      return false;
    }
    if (!degree.trim()) {
      setError('Please provide your current course or degree (e.g. B.Tech, B.Sc, BCA, MBA).');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddSuggestedSkill = (skill) => {
    if (!currentSkills.includes(skill)) {
      setCurrentSkills([...currentSkills, skill]);
    }
  };

  const handleAddSuggestedInterest = (interest) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        role: 'student',
        education_level: educationLevel,
        degree: degree.trim(),
        branch: branch.trim() || degree.trim(),
        experience_level: experienceLevel,
        preferred_category: preferredCategory,
        current_skills: currentSkills,
        interests: interests
      };

      const res = await signupUser(payload);

      // On successful signup, direct user directly to their Dashboard
      if (onSignupSuccess) {
        onSignupSuccess(res.access_token, res.user);
      } else {
        onNavigate('dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.detail || 'Registration failed. Please check your information and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '24px auto', padding: '0 12px' }}>
      <GlassCard style={{ padding: '36px 32px', borderRadius: 16 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: 12,
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}>
            <UserPlus size={26} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
            Create Your Career Profile
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            Join the smart guidance platform tailored to your background and aspirations
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          position: 'relative'
        }}>
          {[
            { step: 1, label: 'Account Info', icon: User },
            { step: 2, label: 'Career Profile', icon: Briefcase },
            { step: 3, label: 'Review & Create', icon: Sparkles }
          ].map((item, idx) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  flex: 1,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: isCurrent ? '#4F46E5' : (isCompleted ? '#10B981' : '#F1F5F9'),
                  color: isCurrent || isCompleted ? '#FFFFFF' : '#64748B',
                  border: isCurrent ? '2px solid #4F46E5' : (isCompleted ? '2px solid #10B981' : '1px solid #CBD5E1'),
                  transition: 'all 0.2s ease'
                }}>
                  {isCompleted ? <CheckCircle size={18} /> : <Icon size={16} />}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#4F46E5' : (isCompleted ? '#0F172A' : '#94A3B8'),
                  textAlign: 'center'
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Validation / Error banner */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT INFORMATION */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Farha K."
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Email Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="form-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="form-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8, padding: '12px', fontSize: '0.92rem', gap: 8 }}
            >
              <span>Continue to Career Profile</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: CAREER PROFILE */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Highest Education <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  autoFocus
                >
                  <option value="">Select Education Level</option>
                  <option value="High School / Diploma">High School / Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate / PhD">Doctorate / PhD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Current Course / Degree <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech, B.Sc, BCA, MBA, B.Com"
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Specialization / Branch (Optional)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical, Finance"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Experience Level
                </label>
                <select
                  className="form-select"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="Student / Fresher">Student / Fresher</option>
                  <option value="Entry Level (0-1 yrs)">Entry Level (0-1 yrs)</option>
                  <option value="Mid Level (2-5 yrs)">Mid Level (2-5 yrs)</option>
                  <option value="Senior Level (5+ yrs)">Senior Level (5+ yrs)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Preferred Career Domain <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                {[
                  { id: 'IT', label: 'IT', desc: 'Software, Data, AI' },
                  { id: 'Non-IT', label: 'Non-IT', desc: 'Management, Core, Design' },
                  { id: 'Undecided', label: 'Undecided', desc: 'Exploring options' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferredCategory(item.id)}
                    className="btn"
                    style={{
                      padding: '10px 8px',
                      border: preferredCategory === item.id ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                      background: preferredCategory === item.id ? '#EEF2FF' : '#FFFFFF',
                      color: preferredCategory === item.id ? '#4F46E5' : '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#64748B' }}>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                  Current Skills (Optional)
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Add any skills you currently possess</span>
              </div>
              <ChipInput
                chips={currentSkills}
                onChange={setCurrentSkills}
                placeholder="Type a skill and press Enter (e.g. Python, SQL)"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {suggestedSkills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSuggestedSkill(skill)}
                    style={{
                      background: currentSkills.includes(skill) ? '#EEF2FF' : '#F8FAFC',
                      border: currentSkills.includes(skill) ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                      color: currentSkills.includes(skill) ? '#4F46E5' : '#475569',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                  Target Career Interests (Optional)
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Fields or roles you're interested in</span>
              </div>
              <ChipInput
                chips={interests}
                onChange={setInterests}
                placeholder="Type an interest and press Enter (e.g. Cloud Computing)"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {suggestedInterests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleAddSuggestedInterest(interest)}
                    style={{
                      background: interests.includes(interest) ? '#EEF2FF' : '#F8FAFC',
                      border: interests.includes(interest) ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                      color: interests.includes(interest) ? '#4F46E5' : '#475569',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {interest}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-outline"
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem', gap: 6 }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', fontSize: '0.9rem', gap: 6 }}
              >
                <span>Review & Confirm</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW AND CREATE ACCOUNT */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Account Information
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Full Name:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{fullName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Email:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{email}</div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Career Profile Summary
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Education:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{educationLevel}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Course / Degree:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{degree}{branch ? ` (${branch})` : ''}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Experience Level:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{experienceLevel}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Preferred Domain:</span>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{preferredCategory}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
                <span style={{ color: '#64748B' }}>Skills:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {currentSkills.length > 0 ? (
                    currentSkills.map(s => (
                      <span key={s} style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.75rem' }}>None specified (can be added later)</span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.82rem' }}>
                <span style={{ color: '#64748B' }}>Career Interests:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {interests.length > 0 ? (
                    interests.map(i => (
                      <span key={i} style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {i}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.75rem' }}>None specified (can be added later)</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '10px 14px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.78rem',
              color: '#166534'
            }}>
              <Shield size={16} />
              <span>Your profile will be securely saved and linked directly to your new account.</span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-outline"
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem', gap: 6 }}
                disabled={loading}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', fontSize: '0.9rem', gap: 6 }}
                disabled={loading}
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account & Go to Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer switch to login */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid #E2E8F0' }}>
          <p style={{ color: '#64748B', fontSize: '0.84rem', margin: 0 }}>
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}