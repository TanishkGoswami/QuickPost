import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoDM } from '../../context/AutoDMContext';
import {
  Plus, MoreHorizontal, Pencil, Trash2, Copy, BarChart3,
  MessageCircle, Send, Users, CheckCircle2, AlertTriangle,
  Clock, Heart, Eye, RefreshCw, TrendingUp, ExternalLink,
  Zap, AlertCircle, X,
} from 'lucide-react';

function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

const TRIGGER_LABELS = {
  comment_on_post: 'Comment on Post',
  comment_on_reel: 'Comment on Reel',
  dm_received: 'DM Received',
  story_reply: 'Story Reply',
  live_comment: 'Live Comment',
  story_mention: 'Story Mention',
};

function AnalyticsModal({ automation, analytics, loading, onClose, onSyncInsights, syncing }) {
  if (!automation) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{automation.name}</h2>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
              {TRIGGER_LABELS[automation.trigger_type] || automation.trigger_type}
              {analytics?.lastUsedAt && ` · Last used ${formatRelativeTime(analytics.lastUsedAt)}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {automation.media_id && (
              <button onClick={onSyncInsights} disabled={syncing} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb',
                fontSize: 12, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
                color: '#374151', opacity: syncing ? 0.7 : 1,
              }}>
                <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync Insights'}
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 80, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Key stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Comments', value: analytics.comments, icon: MessageCircle, color: '#8b5cf6' },
                  { label: 'DMs Sent', value: analytics.dmsSent, icon: Send, color: '#6366f1' },
                  { label: 'Unique Contacts', value: analytics.uniqueContacts, icon: Users, color: '#06b6d4' },
                  { label: 'Success Rate', value: `${analytics.successRate}%`, icon: CheckCircle2, color: '#22c55e', raw: true },
                  { label: 'Failed', value: analytics.failedMessages, icon: AlertTriangle, color: '#ef4444' },
                  { label: 'Follower Growth', value: analytics.followerGrowth != null ? (analytics.followerGrowth >= 0 ? `+${analytics.followerGrowth}` : analytics.followerGrowth) : '—', icon: TrendingUp, color: '#f59e0b', raw: true },
                ].map(({ label, value, icon: Icon, color, raw }) => (
                  <div key={label} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon size={14} color={color} />
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                      {raw ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Post stats if available */}
              {(analytics.postLikes != null || analytics.postComments != null) && (
                <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, border: '1px solid #f0f0f0', background: '#fafafa' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Post Performance</p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {analytics.postLikes != null && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Heart size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#374151' }}>{analytics.postLikes.toLocaleString()} likes</span></div>}
                    {analytics.postComments != null && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageCircle size={14} color="#6366f1" /><span style={{ fontSize: 13, color: '#374151' }}>{analytics.postComments.toLocaleString()} comments</span></div>}
                    {analytics.postViews != null && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={14} color="#06b6d4" /><span style={{ fontSize: 13, color: '#374151' }}>{analytics.postViews.toLocaleString()} views</span></div>}
                    {analytics.postPermalink && <a href={analytics.postPermalink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366f1', textDecoration: 'none' }}><ExternalLink size={12} /> View Post</a>}
                  </div>
                  {analytics.insightsSyncedAt && <p style={{ fontSize: 10, color: '#9ca3af', margin: '8px 0 0' }}>Synced {formatRelativeTime(analytics.insightsSyncedAt)}</p>}
                </div>
              )}

              {/* Session stats */}
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, border: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Sessions</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{analytics.completedSessions}</span><p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Completed</p></div>
                  <div><span style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{analytics.pendingSessions}</span><p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Pending</p></div>
                  <div><span style={{ fontSize: 18, fontWeight: 700, color: '#6b7280' }}>{analytics.expiredSessions}</span><p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Expired</p></div>
                </div>
              </div>

              {/* Recent contacts */}
              {analytics.recentContacts.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Recent Contacts</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analytics.recentContacts.slice(0, 5).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6366f1' }}>
                          {c.username[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>@{c.username}</p>
                          {c.full_name && <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{c.full_name}</p>}
                        </div>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{c.total_messages_sent}↑ {c.total_messages_received}↓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {analytics.recentErrors.length > 0 && (
                <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', margin: '0 0 8px' }}>Recent Errors</p>
                  {analytics.recentErrors.map((e, i) => (
                    <p key={i} style={{ fontSize: 11, color: '#dc2626', margin: '0 0 4px', fontFamily: 'monospace' }}>{e}</p>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}

function DropMenu({ automation, onEdit, onDuplicate, onDelete, onAnalytics }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <MoreHorizontal size={16} color="#6b7280" />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, minWidth: 160 }}>
          {[
            { icon: BarChart3, label: 'Analytics', action: onAnalytics, color: '#6366f1' },
            { icon: Pencil, label: 'Edit', action: onEdit, color: '#374151' },
            { icon: Copy, label: 'Duplicate', action: onDuplicate, color: '#374151' },
            { icon: Trash2, label: 'Delete', action: onDelete, color: '#ef4444' },
          ].map(({ icon: Icon, label, action, color }) => (
            <button key={label} onClick={() => { action(); setOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, color, fontWeight: 500,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutoDMAutomationsPage() {
  const navigate = useNavigate();
  const {
    automations, setAutomations, automationsLoading,
    loadAutomations, activeAccount, updateAutomation,
    deleteAutomation: deleteAutomationFn, createAutomation,
    fetchAnalytics, syncInsights,
  } = useAutoDM();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [analyticsTarget, setAnalyticsTarget] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (activeAccount?.id) loadAutomations();
  }, [activeAccount?.id]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (automation) => {
    setTogglingId(automation.id);
    try {
      const updated = await updateAutomation(automation.id, { is_active: !automation.is_active });
      setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, ...updated } : a));
      showToast(`Automation ${updated.is_active ? 'activated' : 'deactivated'}`);
    } catch (e) {
      showToast(e.message || 'Failed to toggle', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDuplicate = async (automation) => {
    try {
      const { id, created_at, updated_at, ...rest } = automation;
      const created = await createAutomation({ ...rest, name: `${automation.name} (copy)`, is_active: false });
      setAutomations(prev => [created, ...prev]);
      showToast('Automation duplicated');
    } catch (e) {
      showToast(e.message || 'Failed to duplicate', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAutomationFn(deleteTarget.id);
      setAutomations(prev => prev.filter(a => a.id !== deleteTarget.id));
      showToast('Automation deleted');
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openAnalytics = async (automation) => {
    setAnalyticsTarget(automation);
    setAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalytics(automation.id);
      setAnalytics(data);
    } catch (e) {
      showToast(e.message || 'Failed to load analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSyncInsights = async () => {
    if (!analyticsTarget) return;
    setSyncing(true);
    try {
      const updated = await syncInsights(analyticsTarget.id);
      setAutomations(prev => prev.map(a => a.id === analyticsTarget.id ? { ...a, ...updated } : a));
      setAnalyticsTarget(updated);
      const refreshed = await fetchAnalytics(updated.id);
      setAnalytics(refreshed);
      showToast('Insights synced');
    } catch (e) {
      showToast(e.message || 'Failed to sync', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>GAP AutoDM</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Automations</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
            {automations.length} automation{automations.length !== 1 ? 's' : ''}
            {activeAccount && ` · @${activeAccount.username || activeAccount.instagram_username}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/auto-dm/automations/new')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> New Automation
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {automationsLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 64, background: '#f3f4f6', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : automations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Zap size={24} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>No automations yet</h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px' }}>Create your first automation to start sending automated DMs</p>
            <button onClick={() => navigate('/dashboard/auto-dm/automations/new')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} /> Create Automation
            </button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 100px 40px', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f0f0f0', background: '#f9fafb' }}>
              {['AUTOMATION', 'TRIGGER', 'STATUS', 'ACTIVE', ''].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {automations.map((a, i) => (
              <div key={a.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 120px 100px 40px',
                gap: 12, padding: '14px 20px', alignItems: 'center',
                borderBottom: i < automations.length - 1 ? '1px solid #f0f0f0' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Name + media */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                  {a.media_thumbnail || a.media_url ? (
                    <img src={a.media_thumbnail || a.media_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Zap size={18} color="#6366f1" />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                      {a.keywords.length > 0 ? a.keywords.slice(0, 3).join(', ') + (a.keywords.length > 3 ? '…' : '') : 'Any keyword'}
                    </p>
                  </div>
                </div>
                {/* Trigger */}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: 6 }}>
                    {TRIGGER_LABELS[a.trigger_type] || a.trigger_type}
                  </span>
                </div>
                {/* Status info */}
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {formatRelativeTime(a.updated_at)}
                </div>
                {/* Toggle */}
                <div>
                  <button
                    onClick={() => handleToggle(a)}
                    disabled={togglingId === a.id}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      background: a.is_active ? '#6366f1' : '#d1d5db',
                      cursor: togglingId === a.id ? 'not-allowed' : 'pointer',
                      position: 'relative', transition: 'background 0.2s', opacity: togglingId === a.id ? 0.7 : 1,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, left: a.is_active ? 22 : 2,
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {/* Actions */}
                <DropMenu
                  automation={a}
                  onEdit={() => navigate(`/dashboard/auto-dm/automations/${a.id}`)}
                  onDuplicate={() => handleDuplicate(a)}
                  onDelete={() => setDeleteTarget(a)}
                  onAnalytics={() => openAnalytics(a)}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>Delete Automation?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
              "<strong>{deleteTarget.name}</strong>" will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics dialog */}
      {analyticsTarget && (
        <AnalyticsModal
          automation={analyticsTarget}
          analytics={analytics}
          loading={analyticsLoading}
          onClose={() => { setAnalyticsTarget(null); setAnalytics(null); }}
          onSyncInsights={handleSyncInsights}
          syncing={syncing}
        />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
