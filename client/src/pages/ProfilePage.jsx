import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import ChipInput from '../components/common/ChipInput';
import { getProfile, saveProfile } from '../services/api';
import { User, BookOpen, Sliders, Heart, Save, CheckCircle, AlertCircle } from 'lucide-react';

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
      setSuccessMsg('Your profile has been saved successfully!');
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
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#64748B', fontWeight: 600 }}>Loading profile details...</div>
      </GlassCard>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '20px auto' }}>
      <GlassCard style={{ padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #172554 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <User size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              User Profile & Qualifications
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Enter your background, technical skills, and career preferences
            </span>
          </div>
        </div>

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#065F46',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: '0.88rem',
            marginBottom: 20,
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

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Personal Information */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#4F46E5" /> Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="profile-full-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  id="profile-full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label htmlFor="profile-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled
                  value={email}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* Education Details */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} color="#4F46E5" /> Education & Background
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="profile-education-level" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Education Level
                </label>
                <select
                  id="profile-education-level"
                  name="educationLevel"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Ph.D. / Doctorate">Ph.D. / Doctorate</option>
                </select>
              </div>

              <div>
                <label htmlFor="profile-degree" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Degree Program
                </label>
                <input
                  id="profile-degree"
                  name="degree"
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech, B.Sc, BBA, B.Com"
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label htmlFor="profile-branch" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Branch / Specialization
                </label>
                <input
                  id="profile-branch"
                  name="branch"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical, Marketing"
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label htmlFor="profile-graduation-year" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Graduation Year
                </label>
                <input
                  id="profile-graduation-year"
                  name="graduationYear"
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* Current Skills & Interests */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={18} color="#7C3AED" /> Current Skills
            </h3>
            <ChipInput
              id="profile-skills"
              name="currentSkills"
              chips={currentSkills}
              onChange={setCurrentSkills}
              placeholder="Type skill (e.g. Python, SQL, React, SEO) and press Enter..."
            />
          </div>

          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172554', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={18} color="#EC4899" /> Domain Interests
            </h3>
            <ChipInput
              id="profile-interests"
              name="interests"
              chips={interests}
              onChange={setInterests}
              placeholder="Type interest (e.g. Data Science, UI Design, Finance) and press Enter..."
            />
          </div>

          {/* Preferred Category Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#172554', marginBottom: 8 }}>
              Preferred Career Category
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['IT', 'Non-IT', 'Both'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setPreferredCategory(cat)}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: preferredCategory === cat ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                    background: preferredCategory === cat ? 'rgba(79, 70, 229, 0.08)' : '#FFFFFF',
                    color: preferredCategory === cat ? '#4F46E5' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'Both' ? 'Both (IT & Non-IT)' : cat}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn"
            style={{
              background: '#172554',
              color: '#FFFFFF',
              padding: '14px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 10
            }}
          >
            <Save size={18} />
            {saving ? 'Saving Profile...' : 'Save & Update Profile'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
