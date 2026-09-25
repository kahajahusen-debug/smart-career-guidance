import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getJobDetail, saveJob, unsaveJob, createApplication } from '../services/api';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Building2,
  GraduationCap,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function JobDetailPage({ jobId, onBack, onNavigate }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [appStatus, setAppStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (jobId) {
      loadDetail();
    }
  }, [jobId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getJobDetail(jobId);
      setJob(data);
      setIsSaved(!!data.is_saved);
      setAppStatus(data.application_status || null);
    } catch (err) {
      console.error('Error loading job detail:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    try {
      setActionLoading(true);
      if (isSaved) {
        await unsaveJob(jobId);
        setIsSaved(false);
        setNotice('Job removed from saved items.');
      } else {
        await saveJob(jobId);
        setIsSaved(true);
        setNotice('Job saved successfully!');
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      setNotice('Unable to update saved job status. Please log in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackApplication = async () => {
    try {
      setActionLoading(true);
      const res = await createApplication({
        job_id: jobId,
        status: appStatus ? appStatus : 'Applied',
        notes: `Tracked from job detail page.`
      });
      setAppStatus(res.status);
      setNotice(`Application tracked with status: '${res.status}'`);
    } catch (err) {
      console.error('Error tracking application:', err);
      setNotice('Failed to track application. Please check login session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyExternal = () => {
    if (job?.external_url) {
      // Auto-track as Applied if not tracked yet
      if (!appStatus) {
        createApplication({ job_id: jobId, status: 'Applied', notes: 'Applied via external job portal.' }).catch(() => {});
        setAppStatus('Applied');
      }
      window.open(job.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: '#475569', fontWeight: 600 }}>Loading job details & personalized match metrics...</div>
      </GlassCard>
    );
  }

  if (error || !job) {
    return (
      <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={32} color="#EF4444" style={{ marginBottom: 12 }} />
        <h3 style={{ color: '#172554', margin: '0 0 8px 0' }}>Job Not Found</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>{error || 'Unable to retrieve the requested job posting.'}</p>
        <button className="btn btn-outline" onClick={onBack} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Back to Jobs
        </button>
      </GlassCard>
    );
  }

  const matchScore = job.match_score ?? 75;
  const isInternship = job.is_internship || job.employment_type === 'Internship';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={onBack} 
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10 }}
        >
          <ArrowLeft size={16} />
          <span>Back to Opportunities</span>
        </button>

        {appStatus && (
          <span style={{
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#065F46',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <FileCheck size={16} /> Application Status: {appStatus}
          </span>
        )}
      </div>

      {notice && (
        <div style={{
          background: 'rgba(79, 70, 229, 0.1)',
          border: '1px solid rgba(79, 70, 229, 0.25)',
          color: '#3730A3',
          padding: '12px 18px',
          borderRadius: 12,
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {notice}
        </div>
      )}

      {/* Main Job Banner Card */}
      <GlassCard style={{ padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className={`glass-badge ${job.category === 'IT' ? 'badge-it' : 'badge-nonit'}`}>
                {job.category}
              </span>
              <span style={{
                background: isInternship ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: isInternship ? '#D97706' : '#2563EB',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {isInternship ? 'Internship' : (job.employment_type || 'Full-time')}
              </span>
              <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}>
                {job.work_mode || 'Hybrid'}
              </span>
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#172554', margin: '8px 0' }}>
              {job.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4F46E5', fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>
              <Building2 size={18} />
              <span>{job.company}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.88rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="#64748B" />
                <span>{job.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} color="#64748B" />
                <span>{job.experience_level}</span>
              </div>
              {(job.salary_range || job.stipend) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} color="#10B981" />
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{job.salary_range || job.stipend}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personalized Job Match Badge Box */}
          <div style={{
            background: matchScore >= 80 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)' : 'rgba(241, 245, 249, 0.9)',
            border: matchScore >= 80 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0',
            padding: '20px 24px',
            borderRadius: 16,
            textAlign: 'center',
            minWidth: 200
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#059669', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Sparkles size={14} />
              <span>Match Score</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: matchScore >= 80 ? '#047857' : '#1E293B', lineHeight: 1.1, margin: '6px 0' }}>
              {matchScore}%
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              {matchScore >= 85 ? 'Strong Match' : matchScore >= 70 ? 'Good Match' : 'Moderate Match'}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
          {job.external_url && (
            <button 
              onClick={handleApplyExternal}
              className="btn"
              style={{
                background: '#172554',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: 10,
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>Apply on External Site</span>
              <ExternalLink size={16} />
            </button>
          )}

          <button 
            onClick={handleTrackApplication}
            disabled={actionLoading}
            className="btn btn-outline"
            style={{
              borderColor: '#4F46E5',
              color: '#4F46E5',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FileCheck size={16} />
            <span>{appStatus ? 'Update Application Status' : 'Track Application'}</span>
          </button>

          <button 
            onClick={handleToggleSave}
            disabled={actionLoading}
            className="btn btn-outline"
            style={{
              borderColor: isSaved ? '#DC2626' : '#CBD5E1',
              color: isSaved ? '#DC2626' : '#475569',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Bookmark size={16} fill={isSaved ? '#DC2626' : 'none'} />
            <span>{isSaved ? 'Saved Job' : 'Save Job'}</span>
          </button>
        </div>
      </GlassCard>

      {/* Grid Section: Job Details vs Match Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* Left Column: Job Description & Requirements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Why This Job Matches Card */}
          {job.why_this_job_matches && (
            <GlassCard style={{ borderLeft: '4px solid #4F46E5' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#4F46E5" />
                <span>Why This Role Matches Your Profile</span>
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                {job.why_this_job_matches}
              </p>
            </GlassCard>
          )}

          {/* Required & Preferred Skills */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: 0 }}>
              Required & Preferred Skills
            </h3>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                Required Skills:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.required_skills?.map((sk, idx) => {
                  const isMatch = job.matching_skills?.some(ms => ms.toLowerCase() === sk.toLowerCase());
                  return (
                    <span key={idx} style={{
                      background: isMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                      color: isMatch ? '#065F46' : '#991B1B',
                      border: isMatch ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      {isMatch ? <CheckCircle2 size={14} color="#059669" /> : <AlertCircle size={14} color="#DC2626" />}
                      <span>{sk}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {job.preferred_skills && job.preferred_skills.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
                  Preferred Skills:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {job.preferred_skills.map((sk, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(79, 70, 229, 0.08)',
                      color: '#4F46E5',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Description */}
          <GlassCard>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0' }}>
              Job Description
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>
              {job.description || 'No detailed description provided.'}
            </p>

            {job.company_description && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', margin: '0 0 6px 0' }}>
                  About {job.company}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  {job.company_description}
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Skill Gaps & Recommended Readiness */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Education & Qualifications */}
          {job.education && job.education.length > 0 && (
            <GlassCard>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={18} color="#4F46E5" />
                <span>Education & Qualifications</span>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.education.map((edu, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(241, 245, 249, 0.9)',
                    color: '#334155',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}>
                    {edu}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Missing Skills & Recommendations */}
          <GlassCard>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#D97706" />
              <span>Skills to Improve for This Role</span>
            </h3>

            {job.missing_skills && job.missing_skills.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                  Acquiring these skills will significantly raise your job match score:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {job.missing_skills.map((sk, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#B45309',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}>
                      {sk}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => onNavigate && onNavigate('actionPlan')}
                  className="btn btn-outline" 
                  style={{ marginTop: 8, fontSize: '0.82rem', color: '#4F46E5', borderColor: '#C7D2FE' }}
                >
                  View Skill Action Plan →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontSize: '0.88rem', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>You meet all primary skill requirements for this position!</span>
              </div>
            )}
          </GlassCard>

          {/* Match Score Breakdown Details */}
          {job.match_breakdown && (
            <GlassCard>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#172554', margin: '0 0 14px 0' }}>
                Match Score Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(job.match_breakdown).map(([key, val]) => {
                  const label = key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        <span>{label}</span>
                        <span>{val}%</span>
                      </div>
                      <div style={{ background: '#E2E8F0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${val}%`,
                          background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
                          height: '100%'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
