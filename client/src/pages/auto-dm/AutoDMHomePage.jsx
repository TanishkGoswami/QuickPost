import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoDM } from '../../context/AutoDMContext';
import { useAuth } from '../../context/AuthContext';
import {
  Send, Eye, MousePointer, Users, Plus, Calendar,
  ChevronDown, MessageSquare, TrendingUp, Reply, Zap,
  ArrowRight, AlertCircle, Link as LinkIcon,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'Auto DM from Comments',
    description: 'Send DMs to users who comment on your posts',
    icon: MessageSquare,
    href: '/dashboard/auto-dm/automations/new?trigger=comment_on_post',
    badge: 'POPULAR',
    badgeColor: '#ef4444',
  },
  {
    title: 'Grow Followers',
    description: 'Increase followers with automated engagement',
    icon: TrendingUp,
    href: '/dashboard/auto-dm/automations/new?trigger=dm_received',
    badge: 'TRENDING',
    badgeColor: '#6366f1',
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
    <div style={{ textAlign: 'center', padding: '20px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="#6366f1" />
        </div>
      </div>
      {loading ? (
        <div style={{ height: 32, background: '#f3f4f6', borderRadius: 6, margin: '0 auto', width: 60, animation: 'pulse 1.5s infinite' }} />
      ) : (
        <p style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', margin: '4px 0' }}>{value.toLocaleString()}</p>
      )}
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{label}</p>
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
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Send size={32} color="white" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Set Up GAP AutoDM</h1>
        <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
          Link your professional account to start automations.
        </p>

        {importError && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, textAlign: 'left' }}>
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>{importError}</p>
          </div>
        )}
        {autoDMStorageError && (
          <div style={{ padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, textAlign: 'left' }}>
            <AlertCircle size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#9a3412', margin: 0 }}>{autoDMStorageError}</p>
          </div>
        )}

        <button
          onClick={hasSocialInstagramConnection ? handleImport : () => navigate('/dashboard')}
          disabled={importing || (hasSocialInstagramConnection && !autoDMStorageReady)}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontSize: 15, fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            opacity: importing ? 0.7 : 1,
          }}
        >
          {importing
            ? 'Syncing Instagram...'
            : hasSocialInstagramConnection
              ? 'Sync Instagram from Social Pilot'
              : 'Connect Instagram in Social Pilot'} <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Dashboard</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Welcome back, {firstName} 👋</h1>
          <p style={{ color: '#6b7280', margin: '6px 0 0', fontSize: 14 }}>Here's what's happening with your Instagram automation</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/auto-dm/automations/new')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Create Automation
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {QUICK_ACTIONS.map(({ title, description, icon: Icon, href, badge, badgeColor }) => (
            <button
              key={title}
              onClick={() => navigate(href)}
              style={{
                padding: 18, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#6366f1" />
                </div>
                {badge && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: badgeColor, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                    {badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>{title}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Metrics</h2>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDateOpen(!dateOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151',
              }}
            >
              <Calendar size={14} />
              {DATE_OPTIONS.find(o => o.value === days)?.label}
              <ChevronDown size={12} style={{ transform: dateOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {dateOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 20,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 6, minWidth: 160,
              }}>
                {DATE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { setDays(o.value); setDateOpen(false); }}
                    style={{
                      width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none',
                      background: o.value === days ? '#f0f4ff' : 'transparent', borderRadius: 6,
                      cursor: 'pointer', fontSize: 13, color: o.value === days ? '#6366f1' : '#374151',
                      fontWeight: o.value === days ? 600 : 400,
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #f0f0f0' }}>
            <MetricCard label="Messages Sent" value={metrics.messages_sent} icon={Send} loading={metricsLoading} />
            <MetricCard label="Messages Seen" value={metrics.messages_seen} icon={Eye} loading={metricsLoading} />
            <MetricCard label="Total Clicks" value={metrics.total_clicks} icon={MousePointer} loading={metricsLoading} />
            <MetricCard label="Followers Gained" value={metrics.followers_gained} icon={Users} loading={metricsLoading} />
          </div>
        </div>
      </div>

      {/* Recent Automations & Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Recent Automations */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Recent Automations</h3>
            <button onClick={() => navigate('/dashboard/auto-dm/automations')} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              View all →
            </button>
          </div>
          {automationsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 44, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : automations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Zap size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>No automations yet. Create your first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {automations.slice(0, 4).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #f0f0f0', cursor: 'pointer' }}
                  onClick={() => navigate(`/dashboard/auto-dm/automations/${a.id}`)}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.is_active ? '#22c55e' : '#d1d5db', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{a.trigger_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: a.is_active ? '#16a34a' : '#6b7280', textTransform: 'uppercase' }}>
                    {a.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Getting Started</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '1', title: 'Create your first automation', desc: 'Set up auto-replies for comments on your posts or reels' },
              { step: '2', title: 'Define your keywords', desc: 'Choose trigger words like "link", "info", or "price"' },
              { step: '3', title: 'Build your response flow', desc: 'Create engaging DM sequences with buttons and forms' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {step}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>{title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 12, background: '#f0f4ff', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: '#3730a3', margin: 0, lineHeight: 1.5 }}>
              <strong>Pro Tip:</strong> Use simple keywords that your audience naturally types, like "interested" or "send".
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}
