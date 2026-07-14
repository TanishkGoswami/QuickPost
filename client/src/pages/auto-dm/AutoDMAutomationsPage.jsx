import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAutoDM } from '../../context/AutoDMContext';
import AutoDMAccountSwitcher from './AutoDMAccountSwitcher';

function formatRelativeTime(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function triggerLabel(value) {
  return {
    comment_on_post: 'Comments on Post',
    comment_on_reel: 'Comments on Reel',
    dm_received: 'DM Received',
    live_comment: 'Live Comment',
    story_reply: 'Story Reply',
    story_mention: 'Story Mention',
  }[value] || value || 'Automation';
}

function statValue(automation, keys) {
  for (const key of keys) {
    const value = automation?.[key] ?? automation?.analytics?.[key];
    if (value != null) return Number(value) || 0;
  }
  return 0;
}

function AutomationThumb({ automation }) {
  const [imgError, setImgError] = useState(false);
  const src = automation.media_thumbnail || automation.media_url || automation.post_thumbnail || automation.thumbnail_url;
  return (
    <div className="autodm-list-thumb">
      {src && !imgError ? (
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
      ) : (
        <MessageCircle size={18} />
      )}
    </div>
  );
}

function ActionMenu({ automation, onEdit, onData, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="autodm-row-actions">
      <button type="button" className="btn-ghost" onClick={onData}>
        <BarChart3 size={14} />
        Data
      </button>
      <button type="button" className="autodm-icon-action" onClick={onEdit} aria-label="Edit automation">
        <Edit3 size={16} />
      </button>
      <div className="autodm-menu-anchor">
        <button
          type="button"
          className="autodm-icon-action"
          onClick={() => setOpen((value) => !value)}
          aria-label="Automation actions"
          aria-expanded={open}
        >
          <MoreHorizontal size={18} />
        </button>
        {open ? (
          <div className="autodm-menu-popover">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDuplicate();
              }}
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AnalyticsModal({ automation, analytics, loading, onClose, onSync, onEdit }) {
  const comments = analytics?.comments ?? statValue(automation, ['comments', 'comments_count', 'total_comments']);
  const sent =
    analytics?.dmsSent ??
    analytics?.messagesSent ??
    analytics?.dms_sent ??
    statValue(automation, ['dms_sent', 'messages_sent', 'total_messages_sent']);
  const people =
    analytics?.uniqueContacts ??
    analytics?.people ??
    analytics?.unique_people ??
    statValue(automation, ['people', 'contacts_count', 'unique_contacts']);
  const lastUsed = analytics?.lastUsedAt || automation.last_used_at || automation.updated_at || automation.created_at;
  const recentErrors = Array.isArray(analytics?.recentErrors) ? analytics.recentErrors : [];
  const hasIssues = recentErrors.length > 0 || (analytics?.failed || 0) > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content autodm-analytics-modal" onClick={(event) => event.stopPropagation()}>
        <header className="autodm-analytics-header">
          <AutomationThumb automation={automation} />
          <div className="autodm-analytics-title">
            <div>
              <h2>Automation Analytics</h2>
              <span className={`badge ${automation.is_active ? 'badge-success' : 'badge-slate'}`}>
                {automation.is_active ? 'Active' : 'Paused'}
              </span>
            </div>
            <p>
              <strong>{automation.name || 'Untitled Automation'}</strong>
              {' · '}
              {triggerLabel(automation.trigger_type)}
            </p>
          </div>
          <button type="button" className="autodm-modal-close" onClick={onClose} aria-label="Close analytics">
            <X size={18} />
          </button>
        </header>

        <div className="autodm-analytics-body custom-scrollbar">
          {loading ? (
            <div className="autodm-empty">
              <Loader2 className="is-spinning" size={30} />
              <p>Loading analytics</p>
            </div>
          ) : (
            <>
              <div className="autodm-analytics-grid">
                <article className="autodm-analytics-card">
                  <div>
                    <strong>{comments}</strong>
                    <p>Comments</p>
                    <small>Matched events</small>
                  </div>
                  <span><MessageCircle size={18} /></span>
                </article>
                <article className="autodm-analytics-card">
                  <div>
                    <strong>{sent}</strong>
                    <p>DMs Sent</p>
                    <small>Delivered messages</small>
                  </div>
                  <span><Send size={18} /></span>
                </article>
                <article className="autodm-analytics-card">
                  <div>
                    <strong>{people}</strong>
                    <p>People</p>
                    <small>Unique reached</small>
                  </div>
                  <span><Users size={18} /></span>
                </article>
                <article className="autodm-analytics-card">
                  <div>
                    <strong>{formatRelativeTime(lastUsed)}</strong>
                    <p>Last Used</p>
                    <small>Latest activity</small>
                  </div>
                  <span><Clock size={18} /></span>
                </article>
              </div>

              <div className="autodm-analytics-split">
                <section className="autodm-panel">
                  <div className="autodm-panel-head">
                    <div>
                      <h3>Delivery Health</h3>
                      <p>Message delivery and follow-up session status.</p>
                    </div>
                    <span className={`autodm-health ${hasIssues ? 'warn' : ''}`}>
                      {hasIssues ? 'Needs attention' : 'Healthy'}
                    </span>
                  </div>
                  <div className="autodm-metrics-row">
                    <div className="autodm-metric-line">
                      <CheckCircle2 size={16} />
                      <p>Successful</p>
                      <strong>{sent}</strong>
                    </div>
                    <div className="autodm-metric-line">
                      <X size={16} />
                      <p>Send Failed</p>
                      <strong>{analytics?.failed || 0}</strong>
                    </div>
                    <div className="autodm-metric-line">
                      <Clock size={16} />
                      <p>Awaiting Reply</p>
                      <strong>{analytics?.awaiting_reply || 0}</strong>
                    </div>
                  </div>
                  <div className="autodm-progress">
                    <span style={{ width: `${sent > 0 ? 100 : 0}%` }} />
                  </div>
                  <h3 className="autodm-section-title">Issues</h3>
                  {recentErrors.length > 0 ? (
                    <div className="autodm-issue-list">
                      {recentErrors.map((errorText, index) => (
                        <p key={`${errorText}-${index}`}>{errorText}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="autodm-good-box">No recent processing errors found for this automation.</div>
                  )}
                </section>

                <section className="autodm-panel">
                  <div className="autodm-panel-head">
                    <div>
                      <h3>Post Snapshot</h3>
                      <p>Caption, link, and synced post metrics.</p>
                    </div>
                    <button type="button" className="btn-ghost" onClick={() => navigator.clipboard?.writeText(automation.media_permalink || '')}>
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <div className="autodm-post-snapshot">
                    <AutomationThumb automation={automation} />
                    <div>
                      <strong>{automation.media_id || automation.post_id || 'Not synced'}</strong>
                      <p>Sync Meta data to refresh post and follower metrics.</p>
                    </div>
                  </div>
                  <div className="autodm-caption-box">
                    <p>Caption</p>
                    <strong>{automation.media_caption || 'No caption saved yet. Click Sync Meta Data to fetch it.'}</strong>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

        <footer className="autodm-analytics-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
          <button type="button" className="btn-ghost" onClick={onSync}>
            <RefreshCw size={14} />
            Sync Meta Data
          </button>
          <button type="button" className="btn-arc" onClick={onEdit}>Edit Automation</button>
        </footer>
      </div>
    </div>
  );
}

export default function AutoDMAutomationsPage() {
  const navigate = useNavigate();
  const {
    activeAccount,
    automations,
    automationsLoading,
    loadAutomations,
    updateAutomation,
    deleteAutomation,
    createAutomation,
    fetchAnalytics,
    syncInsights,
  } = useAutoDM();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    loadAutomations();
  }, [activeAccount?.id, loadAutomations]);

  const rows = useMemo(() => automations || [], [automations]);

  const openAnalytics = async (automation) => {
    setSelectedAutomation(automation);
    setAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalytics(automation.id);
      setAnalytics(data || {});
    } catch (error) {
      console.error('[AutoDM] Analytics load error:', error);
      setAnalytics({});
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const toggleActive = async (automation) => {
    try {
      await updateAutomation(automation.id, { is_active: !automation.is_active });
      await loadAutomations();
    } catch (error) {
      console.error('[AutoDM] Toggle automation error:', error);
    }
  };

  const duplicateAutomation = async (automation) => {
    try {
      const clone = {
        ...automation,
        id: undefined,
        name: `${automation.name || 'Untitled Automation'} Copy`,
        is_active: false,
      };
      delete clone.created_at;
      delete clone.updated_at;
      await createAutomation(clone);
      await loadAutomations();
    } catch (error) {
      console.error('[AutoDM] Duplicate automation error:', error);
    }
  };

  const removeAutomation = async (automation) => {
    const ok = window.confirm(`Delete "${automation.name || 'Untitled Automation'}"?`);
    if (!ok) return;
    try {
      await deleteAutomation(automation.id);
      await loadAutomations();
    } catch (error) {
      console.error('[AutoDM] Delete automation error:', error);
    }
  };

  const syncSelected = async () => {
    if (!selectedAutomation) return;
    setAnalyticsLoading(true);
    try {
      await syncInsights(selectedAutomation.id);
      const data = await fetchAnalytics(selectedAutomation.id);
      setAnalytics(data || {});
      await loadAutomations();
    } catch (error) {
      console.error('[AutoDM] Sync insights error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="autodm-page">
      <header className="autodm-list-header">
        <div>
          <h1>Automations</h1>
          <p>Create and manage your Instagram automations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AutoDMAccountSwitcher />
          <button type="button" className="autodm-create-btn" onClick={() => navigate('/dashboard/auto-dm/automations/new')}>
            <Plus size={16} />
            Create
          </button>
        </div>
      </header>

      <section className="card-shadow autodm-automation-table">
        <div className="autodm-automation-head">
          <span>Automation</span>
          <span>Status</span>
          <span>Activity</span>
          <span>Updated</span>
          <span>Actions</span>
        </div>

        {automationsLoading ? (
          <div className="autodm-loading-list">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton-shimmer" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="autodm-empty">
            <MessageCircle size={38} />
            <p>No automations yet</p>
            <span>Create your first Instagram automation to start sending DMs.</span>
          </div>
        ) : (
          rows.map((automation) => {
            const comments = statValue(automation, ['comments', 'comments_count', 'total_comments']);
            const sent = statValue(automation, ['dms_sent', 'messages_sent', 'total_messages_sent']);
            return (
              <article key={automation.id} className="autodm-automation-row">
                <div className="autodm-automation-main">
                  <AutomationThumb automation={automation} />
                  <div>
                    <strong>{automation.name || 'Untitled Automation'}</strong>
                    <p>{triggerLabel(automation.trigger_type)}</p>
                    <small>Created {formatRelativeTime(automation.created_at)}</small>
                  </div>
                </div>

                <div className="autodm-status-stack">
                  <span className={`badge ${automation.is_active ? 'badge-success' : 'badge-slate'}`}>
                    {automation.is_active ? 'Active' : 'Paused'}
                  </span>
                  <span className="badge badge-slate">Manual</span>
                  <small>Runs until paused</small>
                </div>

                <div className="autodm-activity-chips">
                  <span><MessageCircle size={14} /> {comments}</span>
                  <span><Send size={14} /> {sent}</span>
                </div>

                <time className="autodm-muted">{formatRelativeTime(automation.updated_at || automation.created_at)}</time>

                <div className="autodm-actions-cell">
                  <button
                    type="button"
                    className={`autodm-switch ${automation.is_active ? 'is-on' : ''}`}
                    onClick={() => toggleActive(automation)}
                    aria-label={automation.is_active ? 'Pause automation' : 'Activate automation'}
                  >
                    <span />
                  </button>
                  <ActionMenu
                    automation={automation}
                    open={openMenuId === automation.id}
                    onEdit={() => navigate(`/dashboard/auto-dm/automations/${automation.id}`)}
                    onData={() => openAnalytics(automation)}
                    onDuplicate={() => duplicateAutomation(automation)}
                    onDelete={() => removeAutomation(automation)}
                    onToggle={() => setOpenMenuId(openMenuId === automation.id ? null : automation.id)}
                  />
                </div>
              </article>
            );
          })
        )}

        {rows.length > 0 ? (
          <footer className="autodm-list-footer">
            <span>Showing {rows.length} automation{rows.length === 1 ? '' : 's'}</span>
            <strong>1-{rows.length} of {rows.length}</strong>
          </footer>
        ) : null}
      </section>

      {selectedAutomation ? (
        <AnalyticsModal
          automation={selectedAutomation}
          analytics={analytics}
          loading={analyticsLoading}
          onClose={() => {
            setSelectedAutomation(null);
            setAnalytics(null);
          }}
          onSync={syncSelected}
          onEdit={() => navigate(`/dashboard/auto-dm/automations/${selectedAutomation.id}`)}
        />
      ) : null}
    </div>
  );
}
