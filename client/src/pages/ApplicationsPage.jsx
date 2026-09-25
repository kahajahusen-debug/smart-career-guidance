import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { getApplications, getApplicationStats, updateApplication, deleteApplication, createApplication } from '../services/api';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

const STATUS_COLORS = {
  Saved: { bg: 'rgba(100, 116, 139, 0.12)', text: '#475569', border: '#CBD5E1' },
  Applied: { bg: 'rgba(59, 130, 246, 0.12)', text: '#2563EB', border: '#93C5FD' },
  Assessment: { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333EA', border: '#C084FC' },
  Interview: { bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706', border: '#FCD34D' },
  Offer: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: '#6EE7B7' },
  Rejected: { bg: 'rgba(239, 68, 68, 0.12)', text: '#DC2626', border: '#FCA5A5' },
  Withdrawn: { bg: 'rgba(148, 163, 184, 0.15)', text: '#64748B', border: '#CBD5E1' }
};

const VALID_STATUSES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationsPage({ onNavigate, onSelectJob }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingAppId, setEditingAppId] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [appsRes, statsRes] = await Promise.all([
        getApplications().catch(() => ({ applications: [] })),
        getApplicationStats().catch(() => null)
      ]);
      setApplications(appsRes.applications || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Error loading applications dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      setNotice(null);
      const updated = await updateApplication(appId, { status: newStatus });
      setApplications(prev => prev.map(a => a.application_id === appId ? updated : a));
      
      // Reload stats
      const newStats = await getApplicationStats().catch(() => null);
      if (newStats) setStats(newStats);
      
      setNotice(`Application status updated to '${newStatus}'.`);
    } catch (err) {
      console.error('Error updating status:', err);
      setNotice('Failed to update status. Please try again.');
    }
  };

  const handleSaveNotes = async (appId) => {
    try {
      const updated = await updateApplication(appId, { notes: notesInput });
      setApplications(prev => prev.map(a => a.application_id === appId ? updated : a));
      setEditingAppId(null);
      setNotesInput('');
      setNotice('Notes saved successfully.');
    } catch (err) {
      console.error('Error saving notes:', err);
      setNotice('Failed to save notes.');
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Are you sure you want to remove this application record?')) return;
    try {
      await deleteApplication(appId);
      setApplications(prev => prev.filter(a => a.application_id !== appId));
      const newStats = await getApplicationStats().catch(() => null);
      if (newStats) setStats(newStats);
      setNotice('Application record deleted.');
    } catch (err) {
      console.error('Error deleting application:', err);
      setNotice('Failed to delete application.');
    }
  };

  const filteredApps = filterStatus === 'all' 
    ? applications 
    : applications.filter(a => a.status === filterStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <GlassCard style={{
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.95) 0%, rgba(79, 70, 229, 0.9) 100%)',
        color: '#FFFFFF',
        padding: '32px'
      }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileCheck size={20} color="#60A5FA" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
              Application Management
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            Application Tracker & Pipeline
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#E2E8F0', marginTop: 8 }}>
            Track saved jobs, active applications, assessment milestones, interview invitations, and job offers in one organized dashboard.
          </p>
        </div>
      </GlassCard>

      {notice && (
        <div style={{
          background: 'rgba(79, 70, 229, 0.1)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          color: '#3730A3',
          padding: '12px 18px',
          borderRadius: 12,
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {notice}
        </div>
      )}

      {/* Summary Statistics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 14
      }}>
        <GlassCard style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#172554', margin: '4px 0' }}>
            {stats?.total ?? applications.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Applications</div>
        </GlassCard>

        <GlassCard style={{ textAlign: 'center', padding: '16px 12px', borderTop: '3px solid #64748B' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Saved</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#475569', margin: '4px 0' }}>
            {stats?.saved ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Bookmarked</div>
        </GlassCard>

        <GlassCard style={{ textAlign: 'center', padding: '16px 12px', borderTop: '3px solid #2563EB' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>Applied</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563EB', margin: '4px 0' }}>
            {stats?.applied ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Submitted</div>
        </GlassCard>

        <GlassCard style={{ textAlign: 'center', padding: '16px 12px', borderTop: '3px solid #9333EA' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9333EA', textTransform: 'uppercase' }}>Assessment</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#9333EA', margin: '4px 0' }}>
            {stats?.assessments ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>In Evaluation</div>
        </GlassCard>

        <GlassCard style={{ textAlign: 'center', padding: '16px 12px', borderTop: '3px solid #D97706' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Interview</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D97706', margin: '4px 0' }}>
            {stats?.interviews ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Scheduled</div>
        </GlassCard>

        <GlassCard style={{ textAlign: 'center', padding: '16px 12px', borderTop: '3px solid #059669' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Offer</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', margin: '4px 0' }}>
            {stats?.offers ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Received</div>
        </GlassCard>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: 'rgba(241, 245, 249, 0.9)', padding: 6, borderRadius: 12 }}>
        <button
          onClick={() => setFilterStatus('all')}
          className="btn"
          style={{
            padding: '6px 14px',
            fontSize: '0.82rem',
            borderRadius: 8,
            border: 'none',
            background: filterStatus === 'all' ? '#172554' : 'transparent',
            color: filterStatus === 'all' ? '#FFFFFF' : '#475569',
            fontWeight: filterStatus === 'all' ? 700 : 500,
            cursor: 'pointer'
          }}
        >
          All ({applications.length})
        </button>

        {VALID_STATUSES.map((st) => {
          const count = applications.filter(a => a.status === st).length;
          const isSelected = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: 8,
                border: 'none',
                background: isSelected ? '#172554' : 'transparent',
                color: isSelected ? '#FFFFFF' : '#475569',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {loading ? (
        <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: '#64748B', fontWeight: 600 }}>Loading applications...</div>
        </GlassCard>
      ) : filteredApps.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '50px 20px' }}>
          <FileCheck size={40} color="#94A3B8" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.15rem', color: '#1E293B', margin: '0 0 8px 0' }}>
            No Applications Found
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 20px 0' }}>
            {filterStatus === 'all' 
              ? 'You have not tracked any job or internship applications yet.' 
              : `No applications with status '${filterStatus}'.`}
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('jobs')} 
            className="btn"
            style={{ background: '#172554', color: '#FFFFFF', padding: '8px 18px', borderRadius: 8, fontWeight: 700 }}
          >
            Explore Recommended Jobs →
          </button>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredApps.map((app) => {
            const statusConfig = STATUS_COLORS[app.status] || STATUS_COLORS.Saved;
            const isEditingNotes = editingAppId === app.application_id;

            return (
              <GlassCard key={app.application_id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#172554', margin: '0 0 4px 0' }}>
                      {app.job_title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4F46E5', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Building2 size={16} />
                      <span>{app.company}</span>
                    </div>
                  </div>

                  {/* Status Dropdown Picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        style={{
                          background: statusConfig.bg,
                          color: statusConfig.text,
                          border: `1px solid ${statusConfig.border}`,
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {VALID_STATUSES.map(st => (
                          <option key={st} value={st} style={{ background: '#FFFFFF', color: '#1E293B' }}>
                            Status: {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleDelete(app.application_id)}
                      title="Delete Application Record"
                      className="btn"
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#DC2626',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub details: Location, Applied Date, Salary */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.82rem', color: '#64748B', background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                  {app.location && <span>Location: <strong>{app.location}</strong></span>}
                  {app.applied_at && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} color="#64748B" />
                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </span>
                  )}
                  {app.salary_range && <span>Pay: <strong>{app.salary_range}</strong></span>}
                </div>

                {/* Notes Section */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Application Notes:
                    </span>
                    {!isEditingNotes && (
                      <button
                        onClick={() => {
                          setEditingAppId(app.application_id);
                          setNotesInput(app.notes || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Edit3 size={14} /> Edit Notes
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input
                        type="text"
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="Add notes (e.g. Interview scheduled for Friday)..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button
                        onClick={() => handleSaveNotes(app.application_id)}
                        className="btn"
                        style={{ background: '#172554', color: '#FFFFFF', padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAppId(null)}
                        className="btn btn-outline"
                        style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.86rem', color: app.notes ? '#334155' : '#94A3B8', margin: 0, italic: !app.notes }}>
                      {app.notes ? app.notes : 'No custom notes added.'}
                    </p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  {app.job_id && (
                    <button
                      onClick={() => onSelectJob && onSelectJob(app.job_id)}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8 }}
                    >
                      View Job Match Details →
                    </button>
                  )}
                  {app.external_url && (
                    <a
                      href={app.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8 }}
                    >
                      External Listing <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
