import React, { useState, useEffect } from 'react';
import { X, User, Bell, Sliders, Shield, CheckCircle, AlertCircle, Save, Sparkles, BookOpen } from 'lucide-react';
import ChipInput from '../common/ChipInput';
import { saveProfile } from '../../services/api';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  profile,
  initialTab = 'profile',
  onProfileUpdated,
  onSaveCategoryPreference
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');

  // Form fields
  const [fullName, setFullName] = useState(user?.full_name || profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || 'Student / Fresher');
  const [preferredCategory, setPreferredCategory] = useState(profile?.preferred_category || 'IT');
  const [currentSkills, setCurrentSkills] = useState(Array.isArray(profile?.current_skills) ? profile.current_skills : []);
  const [interests, setInterests] = useState(Array.isArray(profile?.interests) ? profile.interests : []);
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || '');

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);

  // Status
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'profile');
      setSavedNotice(null);
      setErrorNotice(null);
      // Sync latest profile values
      if (profile) {
        setFullName(profile.full_name || user?.full_name || '');
        setEmail(profile.email || user?.email || '');
        setEducationLevel(profile.education_level || '');
        setDegree(profile.degree || '');
        setBranch(profile.branch || '');
        setExperienceLevel(profile.experience_level || 'Student / Fresher');
        setPreferredCategory(profile.preferred_category || 'IT');
        setCurrentSkills(Array.isArray(profile.current_skills) ? profile.current_skills : []);
        setInterests(Array.isArray(profile.interests) ? profile.interests : []);
        setGraduationYear(profile.graduation_year || '');
      } else if (user) {
        setFullName(user.full_name || '');
        setEmail(user.email || '');
      }
    }
  }, [isOpen, initialTab, profile, user]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSavedNotice(null);
    setErrorNotice(null);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      education_level: educationLevel.trim(),
      degree: degree.trim(),
      branch: branch.trim(),
      experience_level: experienceLevel,
      preferred_category: preferredCategory,
      current_skills: currentSkills,
      interests: interests,
      graduation_year: graduationYear ? Number(graduationYear) : null
    };

    try {
      setSaving(true);
      const updated = await saveProfile(payload);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      if (onSaveCategoryPreference && preferredCategory !== profile?.preferred_category) {
        onSaveCategoryPreference(preferredCategory);
      }
      setSavedNotice('Profile and preferences updated successfully!');
      setTimeout(() => {
        setSavedNotice(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to save profile in settings:', err);
      setErrorNotice(err.response?.data?.detail || 'Failed to update profile. Please verify your details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = () => {
    if (onSaveCategoryPreference) {
      onSaveCategoryPreference(preferredCategory);
    }
    // Also sync to backend profile
    handleSaveProfile();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: 16
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: 620,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Settings & Profile
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Manage your personal information, career qualifications, and preferences
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 8, color: '#64748B' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          {[
            { id: 'profile', label: 'Edit Profile', icon: User },
            { id: 'preferences', label: 'Career Track', icon: Sliders },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSavedNotice(null);
                  setErrorNotice(null);
                }}
                className="btn btn-ghost"
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  fontSize: '0.82rem',
                  fontWeight: isSel ? 700 : 500,
                  color: isSel ? '#4F46E5' : '#64748B',
                  borderBottom: isSel ? '2px solid #4F46E5' : '2px solid transparent',
                  background: isSel ? '#FFFFFF' : 'transparent',
                  borderRadius: 0,
                  gap: 6
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{
          padding: '20px 22px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {savedNotice && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle size={16} />
              <span>{savedNotice}</span>
            </div>
          )}

          {errorNotice && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={16} />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* EDIT PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Farha K."
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="form-input"
                    style={{ background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Highest Education</label>
                  <select
                    className="form-select"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
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
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Current Course / Degree</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Tech, B.Sc, BCA, MBA"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Field of Study / Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science, Mechanical, Finance"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Experience Level</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Preferred Career Domain</label>
                  <select
                    className="form-select"
                    value={preferredCategory}
                    onChange={(e) => setPreferredCategory(e.target.value)}
                  >
                    <option value="IT">IT & Software</option>
                    <option value="Non-IT">Non-IT & Core / Management</option>
                    <option value="Undecided">Undecided / Exploring</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Graduation / Completion Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    min="1990"
                    max="2035"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Current Skills
                </label>
                <ChipInput
                  chips={currentSkills}
                  onChange={setCurrentSkills}
                  placeholder="Type a skill and press Enter (e.g. Python, SQL, Project Management)"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Target Career Interests
                </label>
                <ChipInput
                  chips={interests}
                  onChange={setInterests}
                  placeholder="Type an interest and press Enter (e.g. Artificial Intelligence, Cloud Computing)"
                />
              </div>

              <div style={{
                background: '#F8FAFC',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 4
              }}>
                <Shield size={18} color="#059669" />
                <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Your profile data is private to your account and securely stored in MongoDB.
                </span>
              </div>
            </form>
          )}

          {/* CAREER TRACK PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Preferred Career Track
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 8 }}>
                  {[
                    { id: 'IT', label: 'IT & Software', desc: 'Tech, development, cloud, AI' },
                    { id: 'Non-IT', label: 'Non-IT & Core', desc: 'Management, marketing, finance, core' },
                    { id: 'Undecided', label: 'Undecided', desc: 'Explore all opportunities' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPreferredCategory(cat.id)}
                      className="btn"
                      style={{
                        padding: '14px 12px',
                        border: preferredCategory === cat.id ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                        background: preferredCategory === cat.id ? '#EEF2FF' : '#FFFFFF',
                        color: preferredCategory === cat.id ? '#4F46E5' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        borderRadius: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        textAlign: 'center'
                      }}
                    >
                      <span>{cat.label}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#64748B' }}>{cat.desc}</span>
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: 10 }}>
                  Tailors career recommendations, assessment modules, and job postings to your preferred domain.
                </span>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Action Plan Milestones</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Receive suggestions as you complete roadmap milestones</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#4F46E5' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 0' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Job Matching Updates</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Notify when new curated jobs match your profile skills</div>
                </div>
                <input
                  type="checkbox"
                  checked={jobAlerts}
                  onChange={(e) => setJobAlerts(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#4F46E5' }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 10
        }}>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={activeTab === 'profile' ? handleSaveProfile : handleSavePreferences}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.84rem', gap: 6 }}
            disabled={saving}
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
