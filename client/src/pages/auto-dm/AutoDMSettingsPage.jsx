import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAutoDM } from '../../context/AutoDMContext';
import { Unlink, Plus, Crown, CreditCard, Check, AlertCircle, Instagram } from 'lucide-react';
import apiClient from '../../utils/apiClient';

const PLAN_LIMITS = {
  free: { max_automations: 2, max_dms_per_day: 50, max_instagram_accounts: 1, has_analytics: false, has_crm: false, has_forms: false },
  pro: { max_automations: 50, max_dms_per_day: 1000, max_instagram_accounts: 5, has_analytics: true, has_crm: true, has_forms: true },
  enterprise: { max_automations: -1, max_dms_per_day: -1, max_instagram_accounts: -1, has_analytics: true, has_crm: true, has_forms: true },
};

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 16px', border: 'none', background: 'none',
      cursor: 'pointer', fontSize: 14, fontWeight: 600,
      color: active ? '#6366f1' : '#6b7280',
      borderBottom: `2px solid ${active ? '#6366f1' : 'transparent'}`,
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

export default function AutoDMSettingsPage() {
  const { user } = useAuth();
  const { autodmAccounts, loadStatus, importInstagram, hasSocialInstagramConnection } = useAutoDM();
  const [activeTab, setActiveTab] = useState('general');
  const [importing, setImporting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(null);
  const [importError, setImportError] = useState(null);
  const [toast, setToast] = useState(null);

  const planType = user?.plan?.toLowerCase() || 'free';
  const planLimits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      await importInstagram();
      showToast('Instagram account imported successfully');
    } catch (e) {
      setImportError(e.response?.data?.error || e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!window.confirm('Disconnect this Instagram account? All automations will be paused.')) return;
    setDisconnecting(accountId);
    try {
      await apiClient.patch(`/api/autodm/automations/${accountId}`, { is_connected: false });
      await loadStatus();
      showToast('Account disconnected');
    } catch (e) {
      showToast(e.message || 'Failed to disconnect', 'error');
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>GAP AutoDM</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 24, display: 'flex', gap: 4 }}>
        {['general', 'instagram', 'billing'].map(t => (
          <Tab key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={activeTab === t} onClick={() => setActiveTab(t)} />
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24, maxWidth: 560 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Account Information</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Your Social Pilot account details used for AutoDM</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
              {user?.picture ? (
                <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{user?.name || 'My Account'}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>AutoDM is bridged from Social Pilot</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Your Social Pilot account automatically grants access to AutoDM</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                ✓ Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instagram */}
      {activeTab === 'instagram' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24, maxWidth: 600 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Instagram Accounts</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Instagram accounts connected to AutoDM</p>

          {autodmAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Instagram size={40} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>No accounts connected</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
                {hasSocialInstagramConnection
                  ? 'Import your Instagram account from Social Pilot to get started.'
                  : 'Connect Instagram in Social Pilot first.'}
              </p>
              {importError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 12, display: 'flex', gap: 6, textAlign: 'left' }}>
                  <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>{importError}</p>
                </div>
              )}
              {hasSocialInstagramConnection && (
                <button onClick={handleImport} disabled={importing} style={{
                  padding: '9px 20px', borderRadius: 9, border: 'none',
                  background: 'linear-gradient(135deg, #f58529, #dd2a7b)',
                  color: '#fff', fontWeight: 600, fontSize: 13, cursor: importing ? 'not-allowed' : 'pointer',
                }}>
                  {importing ? 'Importing...' : 'Import from Social Pilot'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {autodmAccounts.map(account => (
                <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
                    {account.profile_picture_url ? (
                      <img src={account.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#6366f1' }}>
                        {account.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>@{account.username}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 4px' }}>{account.full_name}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#f0f4ff', color: '#6366f1' }}>
                      {account.account_type || 'BUSINESS'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6 }}>● Connected</span>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8, padding: 14, background: '#f9fafb', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                  Want to connect a different Instagram account? Connect it in Social Pilot first.
                </p>
                {hasSocialInstagramConnection && (
                  <button onClick={handleImport} disabled={importing} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', color: '#374151',
                  }}>
                    <Plus size={12} /> {importing ? 'Syncing...' : 'Sync from Social Pilot'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div style={{ maxWidth: 700 }}>
          {/* Current plan */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>Current Plan</h2>

            {planType === 'free' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CreditCard size={36} style={{ color: '#d1d5db', marginBottom: 12 }} />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Free Plan</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
                  Upgrade to unlock analytics, CRM, lead forms, and more automations.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #f0f0f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Crown size={24} color="#d97706" />
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: 0, textTransform: 'capitalize' }}>{planType} Plan</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Active subscription</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                    ✓ Active
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Automations', value: planLimits.max_automations === -1 ? '∞' : planLimits.max_automations },
                    { label: 'DMs/day', value: planLimits.max_dms_per_day === -1 ? '∞' : planLimits.max_dms_per_day },
                    { label: 'IG Accounts', value: planLimits.max_instagram_accounts === -1 ? '∞' : planLimits.max_instagram_accounts },
                    { label: 'Lead Forms', value: planLimits.has_forms ? '✓' : '✗' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Plan comparison */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>Compare Plans</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { name: 'Free', price: '$0', features: ['2 Automations', '50 DMs/day', '1 Instagram Account'], highlight: false },
                { name: 'Pro', price: '$29', features: ['50 Automations', '1,000 DMs/day', '5 Instagram Accounts', 'Analytics & CRM', 'Lead Forms'], highlight: true },
                { name: 'Enterprise', price: 'Custom', features: ['Unlimited Automations', 'Unlimited DMs', 'Unlimited Accounts', 'Priority Support', 'Custom Integrations'], highlight: false },
              ].map(({ name, price, features, highlight }) => (
                <div key={name} style={{
                  padding: 20, borderRadius: 12,
                  border: `${highlight ? 2 : 1}px solid ${highlight ? '#6366f1' : '#e5e7eb'}`,
                  position: 'relative',
                }}>
                  {highlight && (
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 6, letterSpacing: '0.08em' }}>
                      POPULAR
                    </div>
                  )}
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{name}</h3>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 14px' }}>
                    {price}<span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{price !== 'Custom' ? '/mo' : ''}</span>
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                        <Check size={12} color="#22c55e" /> {f}
                      </li>
                    ))}
                  </ul>
                  {highlight && planType === 'free' && (
                    <button style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
