import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoDM } from '../../context/AutoDMContext';
import { useAuth } from '../../context/AuthContext';
import {
  Send, Eye, MousePointer, Users, Plus, Calendar,
  ChevronDown, MessageSquare, TrendingUp, Reply, Zap,
  ArrowRight, AlertCircle, ShieldCheck,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'Auto DM from Comments',
    description: 'Send DMs to users who comment on your posts',
    icon: MessageSquare,
    href: '/dashboard/auto-dm/automations/new?trigger=comment_on_post',
    badge: 'POPULAR',
    badgeColor: 'var(--arc)',
  },
  {
    title: 'Grow Followers',
    description: 'Increase followers with automated engagement',
    icon: TrendingUp,
    href: '/dashboard/auto-dm/automations/new?trigger=dm_received',
    badge: 'TRENDING',
    badgeColor: 'var(--color-arc-700)',
  },
  {
    title: 'Generate Leads',
    description: 'Capture leads from your Instagram DMs',
    icon: Users,
    href: '/dashboard/auto-dm/automations/new?type=lead',
  },
  {
    title: 'Auto-reply DMs',
    description: 'Never miss a message with auto responses',
    icon: Reply,
    href: '/dashboard/auto-dm/automations/new?trigger=dm_received',
  },
];

const DATE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

function MetricCard({ label, value, icon: Icon, loading }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 'var(--r-xs)', background: 'var(--color-arc-050)', border: '1px solid var(--color-arc-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="var(--arc)" />
        </div>
      </div>
      {loading ? (
        <div className="skeleton-shimmer" style={{ height: 32, margin: '4px auto', width: 60 }} />
      ) : (
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '4px 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{value.toLocaleString()}</p>
      )}
      <p style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 500, margin: 0 }}>{label}</p>
    </div>
  );
}

export default function AutoDMHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeAccount, autodmAccounts, loading: statusLoading,
    hasSocialInstagramConnection, autoDMStorageReady, autoDMStorageError, importInstagram,
    fetchDailyMetrics, loadAutomations, automations, automationsLoading,
  } = useAutoDM();

  const [days, setDays] = useState('7');
  const [dateOpen, setDateOpen] = useState(false);
  const [metrics, setMetrics] = useState({ messages_sent: 0, messages_seen: 0, total_clicks: 0, followers_gained: 0 });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  useEffect(() => {
    loadDashboardMetrics();
  }, [activeAccount?.id, days]);

  useEffect(() => {
    if (activeAccount?.id) loadAutomations();
  }, [activeAccount?.id]);

  const loadDashboardMetrics = async () => {
    if (!activeAccount?.id) return;
    setMetricsLoading(true);
    try {
      const rows = await fetchDailyMetrics(parseInt(days));
      const agg = rows.reduce(
        (acc, r) => ({
          messages_sent: acc.messages_sent + (r.messages_sent || 0),
          messages_seen: acc.messages_seen + (r.messages_seen || 0),
          total_clicks: acc.total_clicks + (r.total_clicks || 0),
          followers_gained: acc.followers_gained + (r.followers_gained || 0),
        }),
        { messages_sent: 0, messages_seen: 0, total_clicks: 0, followers_gained: 0 }
      );
      setMetrics(agg);
    } catch (e) {
      console.error(e);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      await importInstagram();
    } catch (e) {
      setImportError(e.response?.data?.error || e.message);
    } finally {
      setImporting(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Not connected state
  if (!statusLoading && autodmAccounts.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: '56px auto', textAlign: 'center', background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)', borderRadius: 'var(--r-card)', padding: '44px 28px', boxShadow: 'var(--shadow-premium)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-arc-050)', border: '1px solid var(--color-arc-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Send size={32} color="var(--arc)" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Set Up GAP AutoDM</h1>
        <p style={{ color: 'var(--slate)', marginBottom: 28, lineHeight: 1.6, fontSize: 14 }}>
          Link Instagram once from Social Pilot. The same official connection powers AutoDM, autoposting, and InstaPilot.
        </p>

        {importError && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--r-btn)', marginBottom: 16, display: 'flex', gap: 8, textAlign: 'left' }}>
            <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0, fontWeight: 500 }}>{importError}</p>
          </div>
        )}
        {autoDMStorageError && (
          <div style={{ padding: '10px 14px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--r-btn)', marginBottom: 16, display: 'flex', gap: 8, textAlign: 'left' }}>
            <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: 'var(--warning)', margin: 0, fontWeight: 500 }}>{autoDMStorageError}</p>
          </div>
        )}

        <button
          onClick={hasSocialInstagramConnection ? handleImport : () => navigate('/dashboard')}
          disabled={importing || (hasSocialInstagramConnection && !autoDMStorageReady)}
          className={hasSocialInstagramConnection ? 'btn-arc' : 'btn-ink'}
          style={{
            padding: '12px 28px', borderRadius: 'var(--r-pill)',
            fontSize: 15, cursor: importing ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            opacity: importing ? 0.7 : 1,
            border: 'none',
          }}
        >
          {importing
            ? 'Syncing Instagram...'
            : hasSocialInstagramConnection
              ? 'Sync Instagram from Social Pilot'
              : 'Connect Instagram in Social Pilot'} <ArrowRight size={16} />
        </button>
        <div style={{ margin: '22px auto 0', maxWidth: 520, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', padding: '14px 18px', borderRadius: 'var(--r-hero)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, fontWeight: 500 }}>
            Official Meta Partner workflow: Meta OAuth, Graph API and approved permissions only. No password login or scraping.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 6px' }}>Dashboard</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Welcome back, {firstName} 👋</h1>
          <p style={{ color: 'var(--slate)', margin: '6px 0 0', fontSize: 14, fontWeight: 500 }}>Here's what's happening with your Instagram automation</p>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--success-border)', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--r-pill)', padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            <ShieldCheck size={14} />
            Official Meta Partner
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/auto-dm/automations/new')}
          className="btn-arc"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Create Automation
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14, fontFamily: 'var(--font-display)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {QUICK_ACTIONS.map(({ title, description, icon: Icon, href, badge, badgeColor }) => (
            <button
              key={title}
              onClick={() => navigate(href)}
              className="card-interactive"
              style={{
                padding: 18,
                textAlign: 'left',
                display: 'block',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-xs)', background: 'var(--color-arc-050)', border: '1px solid var(--color-arc-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="var(--arc)" />
                </div>
                {badge && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: badgeColor, padding: '2px 6px', borderRadius: 'var(--r-xs)', letterSpacing: '0.05em' }}>
                    {badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>{title}</p>
              <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)' }}>Metrics</h2>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDateOpen(!dateOpen)}
              className="btn-ghost"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', fontSize: 13, fontWeight: 600,
              }}
            >
              <Calendar size={14} />
              {DATE_OPTIONS.find(o => o.value === days)?.label}
              <ChevronDown size={12} style={{ transform: dateOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {dateOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 20,
                background: 'var(--white)', border: '1px solid rgba(20,20,19,0.1)', borderRadius: 'var(--r-btn)',
                boxShadow: 'var(--shadow-card)', padding: 6, minWidth: 160,
              }}>
                {DATE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { setDays(o.value); setDateOpen(false); }}
                    style={{
                      width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none',
                      background: o.value === days ? 'var(--color-arc-050)' : 'transparent', borderRadius: 'var(--r-sm)',
                      cursor: 'pointer', fontSize: 13, color: o.value === days ? 'var(--arc)' : 'var(--slate)',
                      fontWeight: o.value === days ? 700 : 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-shadow">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <MetricCard label="Messages Sent" value={metrics.messages_sent} icon={Send} loading={metricsLoading} />
            <div style={{ borderLeft: '1px solid rgba(20,20,19,0.06)' }}>
              <MetricCard label="Messages Seen" value={metrics.messages_seen} icon={Eye} loading={metricsLoading} />
            </div>
            <div style={{ borderLeft: '1px solid rgba(20,20,19,0.06)' }}>
              <MetricCard label="Total Clicks" value={metrics.total_clicks} icon={MousePointer} loading={metricsLoading} />
            </div>
            <div style={{ borderLeft: '1px solid rgba(20,20,19,0.06)' }}>
              <MetricCard label="Followers Gained" value={metrics.followers_gained} icon={Users} loading={metricsLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Automations & Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Recent Automations */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)' }}>Recent Automations</h3>
            <button onClick={() => navigate('/dashboard/auto-dm/automations')} style={{ fontSize: 12, color: 'var(--arc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              View all →
            </button>
          </div>
          {automationsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton-shimmer" style={{ height: 44 }} />
              ))}
            </div>
          ) : automations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Zap size={32} color="var(--dust)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--slate)', fontWeight: 500, margin: 0 }}>No automations yet. Create your first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {automations.slice(0, 4).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20,20,19,0.06)', background: 'var(--white)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(20,20,19,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(20,20,19,0.06)'; e.currentTarget.style.transform = 'none'; }}
                  onClick={() => navigate(`/dashboard/auto-dm/automations/${a.id}`)}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.is_active ? 'var(--success)' : 'var(--dust)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 500, margin: 0 }}>{a.trigger_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: a.is_active ? 'var(--success)' : 'var(--slate)', textTransform: 'uppercase' }}>
                    {a.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Getting Started</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '1', title: 'Create your first automation', desc: 'Set up auto-replies for comments on your posts or reels' },
              { step: '2', title: 'Define your keywords', desc: 'Choose trigger words like "link", "info", or "price"' },
              { step: '3', title: 'Build your response flow', desc: 'Create engaging DM sequences with buttons and forms' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 'var(--r-xs)', background: 'var(--color-arc-050)', border: '1px solid var(--color-arc-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--arc)', flexShrink: 0 }}>
                  {step}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '0 0 2px' }}>{title}</p>
                  <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--color-arc-050)', border: '1px solid var(--color-arc-100)', borderRadius: 'var(--r-btn)' }}>
            <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              <strong style={{ color: 'var(--arc)' }}>Pro Tip:</strong> Use simple keywords that your audience naturally types, like "interested" or "send".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
