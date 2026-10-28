import React, { useState } from 'react';
import { X, User, Bell, Sliders, Shield, CheckCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, user, profile, onSaveCategoryPreference }) {
  const [activeTab, setActiveTab] = useState('account');
  const [preferredCategory, setPreferredCategory] = useState(profile?.preferred_category || 'IT');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSaveCategoryPreference) {
      onSaveCategoryPreference(preferredCategory);
    }
    setSavedNotice('Preferences saved successfully!');
    setTimeout(() => {
      setSavedNotice(null);
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(2px)',
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
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: 540,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Settings & Preferences
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Manage your career guidance platform preferences
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 8 }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          {[
            { id: 'account', label: 'Account Profile', icon: User },
            { id: 'preferences', label: 'Career Preferences', icon: Sliders },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn btn-ghost"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  fontWeight: isSel ? 700 : 500,
                  color: isSel ? '#4F46E5' : '#64748B',
                  borderBottom: isSel ? '2px solid #4F46E5' : '2px solid transparent',
                  borderRadius: 0,
                  gap: 6
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || ''}
                  className="form-input"
                  style={{ background: '#F8FAFC', color: '#64748B' }}
                />
              </div>

              <div>
                <label className="form-label">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="form-input"
                  style={{ background: '#F8FAFC', color: '#64748B' }}
                />
              </div>

              <div style={{
                background: '#F8FAFC',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <Shield size={18} color="#059669" />
                <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Your account is secured with JWT authentication and encrypted MongoDB storage.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Preferred Career Track</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                  {['IT', 'Non-IT'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPreferredCategory(cat)}
                      className="btn"
                      style={{
                        padding: '12px',
                        border: preferredCategory === cat ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                        background: preferredCategory === cat ? '#EEF2FF' : '#FFFFFF',
                        color: preferredCategory === cat ? '#4F46E5' : '#0F172A',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderRadius: 10
                      }}
                    >
                      {cat === 'IT' ? 'IT & Tech Pathways' : 'Non-IT & Management'}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: 6 }}>
                  Tailors recommendations, assessment questions, and suggested jobs towards your preferred industry.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
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

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
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
          padding: '14px 20px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10
        }}>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.84rem' }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
