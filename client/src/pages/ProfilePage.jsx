import React, { useState, useEffect } from 'react';
import ChipInput from '../components/common/ChipInput';
import { getProfile, saveProfile } from '../services/api';
import {
  User,
  BookOpen,
  Sliders,
  Heart,
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ProfilePage({ user, onProfileUpdated }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree");
  const [degree, setDegree] = useState("B.Tech / B.E.");
  const [branch, setBranch] = useState("Computer Science");
  const [graduationYear, setGraduationYear] = useState(2026);
  const [currentSkills, setCurrentSkills] = useState(["Python", "JavaScript", "SQL", "React"]);
  const [interests, setInterests] = useState(["Software Engineering", "AI", "Web Development"]);
  const [preferredCategory, setPreferredCategory] = useState("IT");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      if (res) {
        setFullName(res.full_name || user?.full_name || '');
        setEmail(res.email || user?.email || '');
        setEducationLevel(res.education_level || "Bachelor's Degree");
        setDegree(res.degree || "B.Tech / B.E.");
        setBranch(res.branch || "Computer Science");
        setGraduationYear(res.graduation_year || 2026);
        setCurrentSkills(res.current_skills || []);
        setInterests(res.interests || []);
        setPreferredCategory(res.preferred_category || "IT");
      }
    } catch (err) {
      console.log('No existing profile found or default initialized:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const checks = [
      Boolean(fullName.trim()),
      Boolean(email.trim()),
      Boolean(educationLevel),
      Boolean(degree.trim()),
      Boolean(branch.trim()),
      Boolean(graduationYear),
      currentSkills.length >= 2,
      interests.length >= 1,
      Boolean(preferredCategory)
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      full_name: fullName,
      email,
      education_level: educationLevel,
      degree,
      branch,
      graduation_year: Number(graduationYear),
      current_skills: currentSkills,
      interests,
      preferred_category: preferredCategory
    };

    try {
      setSaving(true);
      const updatedProfile = await saveProfile(payload);
      setSuccessMsg('Your profile and career qualifications have been updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        textAlign: 'center',
        padding: '56px 20px'
      }}>
        <div style={{ color: '#64748B', fontWeight: 600 }}>Loading profile details...</div>
      </div>
    );
  }

  const completionPct = calculateCompletion();

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner & Profile Completion Meter */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="saas-badge badge-it">
              <User size={13} /> Student Profile Matrix
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            My Profile & Qualifications
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0 0' }}>
            Keep your skills, degree, and domain preferences up to date for precise recommendation ranking.
          </p>
        </div>

        {/* Completion Widget */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '12px 18px',
          textAlign: 'center',
          minWidth: 150
        }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
            Profile Strength
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: completionPct >= 80 ? '#059669' : '#4F46E5', margin: '2px 0' }}>
            {completionPct}%
          </div>
          <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${completionPct}%`,
              height: '100%',
              background: completionPct >= 80 ? '#059669' : '#4F46E5',
              borderRadius: 999,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          padding: '12px 16px',
          borderRadius: 10,
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          padding: '12px 16px',
          borderRadius: 10,
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: Basic Information */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
            <User size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              1. Basic Information
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <label htmlFor="profile-full-name" className="form-label">
                Full Name <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="profile-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="form-label">
                Email Address (Account ID)
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled
                value={email}
                className="form-input"
                style={{ background: '#F8FAFC', color: '#64748B' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Education & Background */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
            <BookOpen size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              2. Education & Background
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label htmlFor="profile-education-level" className="form-label">
                Education Level
              </label>
              <select
                id="profile-education-level"
                name="educationLevel"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="form-select"
              >
                <option value="High School">High School</option>
                <option value="Associate Degree">Associate Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Ph.D.">Ph.D.</option>
              </select>
            </div>

            <div>
              <label htmlFor="profile-degree" className="form-label">
                Degree Title
              </label>
              <input
                id="profile-degree"
                name="degree"
                type="text"
                placeholder="e.g. B.Tech / B.E. / B.Sc"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="profile-branch" className="form-label">
                Major / Branch
              </label>
              <input
                id="profile-branch"
                name="branch"
                type="text"
                placeholder="e.g. Computer Science / Business"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="profile-graduation-year" className="form-label">
                Graduation Year
              </label>
              <input
                id="profile-graduation-year"
                name="graduationYear"
                type="number"
                min="1990"
                max="2035"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Current Skills */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Sliders size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              3. Current Skills
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 14px 0' }}>
            Type a skill and press <strong>Enter</strong> to add. These are evaluated directly against industry requirements.
          </p>

          <ChipInput
            chips={currentSkills}
            onAddChip={(chip) => setCurrentSkills([...currentSkills, chip])}
            onRemoveChip={(chip) => setCurrentSkills(currentSkills.filter(c => c !== chip))}
            placeholder="Add skills (e.g., Python, SQL, React, Data Analysis)..."
          />
        </div>

        {/* Section 4: Domain Interests */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Heart size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              4. Domain Interests
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 14px 0' }}>
            Areas and industries you are enthusiastic about exploring.
          </p>

          <ChipInput
            chips={interests}
            onAddChip={(chip) => setInterests([...interests, chip])}
            onRemoveChip={(chip) => setInterests(interests.filter(c => c !== chip))}
            placeholder="Add interests (e.g., AI, Cloud, Finance, Design, Healthcare)..."
          />
        </div>

        {/* Section 5: Preferred Career Category */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Layers size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              5. Preferred Career Category
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { id: 'IT', title: 'Information Technology (IT)', desc: 'Software, Data, Cloud/DevOps, AI/ML, Cybersecurity' },
              { id: 'Non-IT', title: 'Non-IT & Management', desc: 'Product, Marketing, Analytics, Finance, Operations' }
            ].map((cat) => (
              <div
                key={cat.id}
                onClick={() => setPreferredCategory(cat.id)}
                style={{
                  border: preferredCategory === cat.id ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                  background: preferredCategory === cat.id ? '#EEF2FF' : '#FFFFFF',
                  borderRadius: 12,
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: preferredCategory === cat.id ? '#4F46E5' : '#0F172A' }}>
                    {cat.title}
                  </span>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: preferredCategory === cat.id ? '5px solid #4F46E5' : '2px solid #CBD5E1',
                    background: '#FFFFFF'
                  }} />
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '6px 0 0 0' }}>
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '11px 24px', fontSize: '0.92rem' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving Profile...' : 'Save & Update Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
