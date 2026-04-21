import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Calendar, ChevronDown, ChevronUp, ExternalLink,
  Clock, Share2, CheckCircle2, XCircle, Video, Image as ImageIcon,
  LayoutGrid, List, ChevronLeft, ChevronRight, Play, ThumbsUp, Eye
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import ComposerModal from './ComposerModal';
import PostPreviewModal from './PostPreviewModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── token shortcuts ── */
const css = {
  canvas:  'var(--canvas)',
  lifted:  'var(--canvas-lifted)',
  ink:     'var(--ink)',
  white:   'var(--white)',
  slate:   'var(--slate)',
  dust:    'var(--dust)',
  arc:     'var(--arc)',
  shadow:  'var(--shadow-card)',
  r_btn:   'var(--r-btn)',
  r_hero:  'var(--r-hero)',
  r_pill:  'var(--r-pill)',
};

/* ── Platform helpers ── */
function getPlatformIcon(id) {
  const s = { width: 16, height: 16, objectFit: 'contain' };
  switch (id) {
    case 'facebook':  return <img src="/icons/facebook-round-color-icon.svg" style={s} alt="Facebook" />;
    case 'instagram': return <img src="/icons/ig-instagram-icon.svg" style={s} alt="Instagram" />;
    case 'x':         return <img src="/icons/x-social-media-round-icon.svg" style={s} alt="X" />;
    case 'linkedin':  return <img src="/icons/linkedin-icon.svg" style={s} alt="LinkedIn" />;
    case 'tiktok':    return <img src="/icons/tiktok-circle-icon.svg" style={s} alt="TikTok" />;
    case 'youtube':   return <img src="/icons/youtube-color-icon.svg" style={s} alt="YouTube" />;
    case 'pinterest': return <img src="/icons/pinterest-round-color-icon.svg" style={s} alt="Pinterest" />;
    case 'threads':   return <img src="/icons/threads-icon.svg" style={s} alt="Threads" />;
    case 'mastodon':  return <img src="/icons/mastodon-round-icon.svg" style={s} alt="Mastodon" />;
    case 'bluesky':   return <img src="/icons/bluesky-circle-color-icon.svg" style={s} alt="Bluesky" />;
    case 'reddit':    return <img src="/icons/reddit-icon.svg" style={s} alt="Reddit" />;
    default:          return <Share2 size={16} />;
  }
}

function buildPlatforms(post) {
  return [
    { id: 'linkedin',  name: 'LinkedIn',  success: post.linkedin_success,  error: post.linkedin_error,  url: post.linkedin_url },
    { id: 'youtube',   name: 'YouTube',   success: post.youtube_success,   error: post.youtube_error,   url: post.youtube_shorts_url || post.youtube_url },
    { id: 'instagram', name: 'Instagram', success: post.instagram_success, error: post.instagram_error, url: post.instagram_url },
    { id: 'facebook',  name: 'Facebook',  success: post.facebook_success,  error: post.facebook_error,  url: post.facebook_url },
    { id: 'tiktok',    name: 'TikTok',    success: post.tiktok_success,    error: post.tiktok_error,    url: null },
    { id: 'mastodon',  name: 'Mastodon',  success: post.mastodon_success,  error: post.mastodon_error,  url: post.mastodon_url },
    { id: 'bluesky',   name: 'Bluesky',   success: post.bluesky_success,   error: post.bluesky_error,   url: post.bluesky_url },
    { id: 'pinterest', name: 'Pinterest', success: post.pinterest_success, error: post.pinterest_error, url: post.pinterest_url },
    { id: 'threads',   name: 'Threads',   success: post.threads_success,   error: post.threads_error,   url: post.threads_url },
    { id: 'x',         name: 'X',         success: post.x_success,         error: post.x_error,         url: post.x_url },
    { id: 'reddit',    name: 'Reddit',    success: post.reddit_success,    error: post.reddit_error,    url: post.reddit_url },
  ].filter(p => p.success || (p.error && p.error !== 'Not selected'));
}

/* ── Media thumbnail ── */
function MediaThumb({ post, className = '', style = {} }) {
  const isImage = post.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || '');
  const displayUrl = post.thumbnail_url || (isImage ? post.media_url : null);
  return (
    <div className={className} style={{ background: '#e8e2da', overflow: 'hidden', position: 'relative', ...style }}>
      {displayUrl ? (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <img src={displayUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', display: 'block' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            onError={e => { e.target.src = 'https://placehold.co/300x300?text=Preview'; }}
          />
          {post.youtube_success && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.08)' }}>
              <div style={{ width: 42, height: 42, background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <Play size={18} style={{ color: '#fff', fill: '#fff', marginLeft: 3 }} />
              </div>
            </div>
          )}
        </div>
      ) : isImage ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#e8e2da' }}>
          <ImageIcon size={28} style={{ color: '#9a9088' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#9a9088', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Image</span>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: css.ink }}>
          <Video size={28} style={{ color: 'rgba(243,240,238,0.5)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(243,240,238,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Video</span>
        </div>
      )}
    </div>
  );
}

/* ── Platform badge ── */
function PlatformBadge({ platform }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
      borderRadius: css.r_pill, fontSize: 10, fontWeight: 700,
      background: platform.success ? '#e6f4ea' : '#fde8e8',
      color: platform.success ? '#1a6b34' : '#9b1c1c',
      border: `1px solid ${platform.success ? '#b7dfc3' : '#f5b8b8'}`,
    }}>
      {getPlatformIcon(platform.id)}
      <span>{platform.name}</span>
      {platform.success
        ? <CheckCircle2 size={10} />
        : <XCircle size={10} />
      }
    </div>
  );
}

/* ── Grid card ── */
function GridCard({ post, onOpen, formatDate }) {
  const platforms = buildPlatforms(post);
  const successCount = platforms.filter(p => p.success).length;
  return (
    <div
      onClick={onOpen}
      style={{
        background: css.lifted,
        borderRadius: css.r_hero,
        border: '1px solid rgba(20,20,19,0.07)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.25s, transform 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = css.shadow; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Thumb */}
      <div style={{ position: 'relative' }}>
        <MediaThumb post={post} style={{ width: '100%', height: 176, borderRadius: 0 }} />
        {/* Media type badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '3px 10px', borderRadius: css.r_pill,
          background: 'rgba(20,20,19,0.7)', color: css.canvas,
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {post.media_type || 'media'}
        </div>
        {/* Platform count */}
        {successCount > 0 && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            padding: '3px 10px', borderRadius: css.r_pill,
            background: 'rgba(20,20,19,0.82)', color: css.canvas,
            fontSize: 9, fontWeight: 700,
          }}>
            {successCount} platform{successCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: css.slate, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Calendar size={10} />{formatDate(post.posted_at)}
          </div>
          {post.youtube_success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: css.slate }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><ThumbsUp size={10} /> 12</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Eye size={10} /> 2.4k</span>
            </div>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: css.ink, margin: '0 0 12px', lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.caption || <span style={{ color: css.dust, fontStyle: 'italic' }}>No caption</span>}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {platforms.map(p => <PlatformBadge key={p.id} platform={p} />)}
        </div>
      </div>
    </div>
  );
}

/* ── List row ── */
function ListRow({ post, expanded, onToggle, formatDate }) {
  const platforms = buildPlatforms(post);
  return (
    <div style={{
      background: css.lifted,
      borderRadius: css.r_hero,
      border: `1px solid ${expanded ? 'rgba(20,20,19,0.20)' : 'rgba(20,20,19,0.07)'}`,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      boxShadow: expanded ? css.shadow : 'none',
    }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer' }} onClick={onToggle}>
        <MediaThumb post={post} style={{ width: 72, height: 72, borderRadius: 'var(--r-btn)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: css.slate, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Calendar size={10} />{formatDate(post.posted_at)}
            </div>
            {expanded ? <ChevronUp size={14} style={{ color: css.slate }} /> : <ChevronDown size={14} style={{ color: css.slate }} />}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: css.ink, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.caption || 'Untitled Broadcast'}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {platforms.map(p => <PlatformBadge key={p.id} platform={p} />)}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(20,20,19,0.07)', background: css.canvas, padding: '16px 20px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
            {platforms.map(p => (
              <div key={p.id} style={{ background: css.lifted, padding: '12px 14px', borderRadius: css.r_btn, border: '1px solid rgba(20,20,19,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{getPlatformIcon(p.id)}<span style={{ fontSize: 12, fontWeight: 700, color: css.ink }}>{p.name}</span></div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: css.r_pill, background: p.success ? '#e6f4ea' : '#fde8e8', color: p.success ? '#1a6b34' : '#9b1c1c', border: `1px solid ${p.success ? '#b7dfc3' : '#f5b8b8'}` }}>
                    {p.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {p.success
                  ? p.url
                    ? <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--link)', fontWeight: 700 }}>View Live Post <ExternalLink size={10} /></a>
                    : <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: css.slate, fontWeight: 600 }}><Clock size={10} /> Pending Sync</div>
                  : <p style={{ fontSize: 10, color: '#dc2626', fontStyle: 'italic', margin: 0 }}>{p.error || 'API error'}</p>
                }
              </div>
            ))}
          </div>
          {post.caption && (
            <div style={{ background: css.lifted, padding: '12px 14px', borderRadius: css.r_btn, border: '1px solid rgba(20,20,19,0.07)' }}>
              <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10 }}>Full Caption</div>
              <p style={{ fontSize: 13, color: css.ink, whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>{post.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════ */
function Dashboard() {
  const { user, refreshAccounts } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sent');
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedPost, setSelectedPost] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const tabs = [
    { id: 'sent',    label: 'Sent',    count: activeTab === 'sent'    ? broadcasts.length : 0 },
    { id: 'queue',   label: 'Queue',   count: queueCount },
    { id: 'drafts',  label: 'Drafts',  count: 0 },
    { id: 'history', label: 'History', count: activeTab === 'history' ? broadcasts.length : 0 },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) { refreshAccounts(); window.history.replaceState({}, '', '/dashboard'); }
    apiClient.get('/api/broadcasts/stats').then(r => setQueueCount(r.data.pending || 0)).catch(() => {});
  }, [refreshAccounts]);

  useEffect(() => { fetchBroadcasts(); setCurrentPage(1); }, [activeTab]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const params = activeTab === 'sent' ? { status: 'sent' } : {};
      const response = await apiClient.get('/api/broadcasts', { params });
      setBroadcasts(response.data.broadcasts || []);
    } catch (err) { setBroadcasts([]); }
    finally { setLoading(false); }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);
  const filtered = broadcasts.filter(b => b.caption?.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  /* ── Pagination ── */
  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40, marginBottom: 24 }}>
        <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
          style={{ padding: 8, borderRadius: css.r_btn, border: '1.5px solid rgba(20,20,19,0.15)', background: css.lifted, cursor: 'pointer', color: css.slate, opacity: currentPage === 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16} />
        </button>
        {pages.map(page => (
          <button key={page} onClick={() => handlePageChange(page)}
            style={{ width: 36, height: 36, borderRadius: css.r_btn, border: `1.5px solid ${currentPage === page ? css.ink : 'rgba(20,20,19,0.15)'}`, background: currentPage === page ? css.ink : css.lifted, color: currentPage === page ? css.canvas : css.slate, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
            {page}
          </button>
        ))}
        <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
          style={{ padding: 8, borderRadius: css.r_btn, border: '1.5px solid rgba(20,20,19,0.15)', background: css.lifted, cursor: 'pointer', color: css.slate, opacity: currentPage === totalPages ? 0.3 : 1, display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: css.canvas, fontFamily: 'var(--font)' }}>

      {/* ── Top header ── */}
      <div style={{
        background: css.canon,
        borderBottom: '1px solid rgba(20,20,19,0.08)',
        padding: '18px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: css.lifted,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Overview</div>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: css.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>Post Analytics</h1>
        </div>
        <button
          onClick={() => setComposerOpen(true)}
          className="btn-ink"
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '10px 22px' }}
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: css.lifted, borderBottom: '1px solid rgba(20,20,19,0.08)', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 32 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { if (tab.id === 'queue') { navigate('/dashboard/queue'); return; } setActiveTab(tab.id); }}
              style={{
                padding: '14px 0',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: active ? css.ink : css.slate,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: `2px solid ${active ? css.ink : 'transparent'}`,
                marginBottom: -1,
                transition: 'color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  padding: '1px 8px',
                  borderRadius: css.r_pill,
                  fontSize: 10,
                  fontWeight: 700,
                  background: active ? css.ink : 'rgba(20,20,19,0.07)',
                  color: active ? css.canvas : css.slate,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      {(activeTab === 'sent' || activeTab === 'history') && !loading && broadcasts.length > 0 && (
        <div style={{ background: css.canvas, borderBottom: '1px solid rgba(20,20,19,0.06)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} style={{ color: css.arc }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: css.ink }}>{broadcasts.length}</span>
              <span style={{ fontSize: 12, color: css.slate }}>total posts</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'rgba(20,20,19,0.12)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: css.ink }}>
                {broadcasts.filter(b => buildPlatforms(b).some(p => p.success)).length}
              </span>
              <span style={{ fontSize: 12, color: css.slate }}>successful</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: css.slate }} />
              <input
                type="text"
                placeholder="Search posts…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
                  background: css.lifted,
                  border: '1px solid rgba(20,20,19,0.12)',
                  borderRadius: css.r_pill,
                  fontSize: 13, color: css.ink, fontFamily: 'var(--font)',
                  outline: 'none', width: 200,
                }}
                onFocus={e => e.target.style.borderColor = css.ink}
                onBlur={e => e.target.style.borderColor = 'rgba(20,20,19,0.12)'}
              />
            </div>
            {/* View toggle */}
            <div style={{ display: 'flex', background: css.lifted, border: '1px solid rgba(20,20,19,0.10)', borderRadius: css.r_pill, padding: 3, gap: 2 }}>
              {[
                { mode: 'grid', icon: <LayoutGrid size={14} /> },
                { mode: 'list', icon: <List size={14} /> },
              ].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={`${mode} view`}
                  style={{ padding: '5px 10px', borderRadius: css.r_pill, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', background: viewMode === mode ? css.ink : 'transparent', color: viewMode === mode ? css.canvas : css.slate, transition: 'all 0.2s' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ padding: '28px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            {/* Mastercard-style spinner: three staggered circles */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: css.ink, animation: 'mc-float 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: css.slate, margin: 0 }}>Syncing data…</p>
          </div>
        ) : (activeTab === 'sent' || activeTab === 'history') && filtered.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {paginatedItems.map(post => (
                  <GridCard key={post.id} post={post} onOpen={() => setSelectedPost(post)} formatDate={formatDate} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 860, margin: '0 auto' }}>
                {paginatedItems.map(post => (
                  <div key={post.id} onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer' }}>
                    <ListRow post={post} expanded={expandedId === post.id}
                      onToggle={e => { e?.stopPropagation(); toggleExpand(post.id); }}
                      formatDate={formatDate}
                    />
                  </div>
                ))}
              </div>
            )}
            <Pagination />
          </>
        ) : (
          /* ── Empty state ── */
          <div style={{
            background: css.lifted,
            borderRadius: css.r_hero,
            border: '1px dashed rgba(20,20,19,0.15)',
            padding: '80px 40px',
            textAlign: 'center',
          }}>
            {/* Ghost watermark behind the icon */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
              <div className="watermark" style={{ fontSize: 80, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap' }}>✦</div>
              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: css.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Share2 size={26} style={{ color: css.canvas }} />
              </div>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 500, color: css.ink, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              {activeTab === 'queue' ? 'Your queue is empty'
                : activeTab === 'drafts' ? 'No drafts yet'
                : activeTab === 'history' ? 'No broadcast history yet'
                : 'Ready for your first boost?'}
            </h3>
            <p style={{ fontSize: 14, color: css.slate, margin: '0 0 28px', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              {activeTab === 'sent' || activeTab === 'history'
                ? 'Create a post and broadcast it across your social channels to see analytics here.'
                : 'Schedule posts to see them appear here.'}
            </p>
            {(activeTab === 'sent' || activeTab === 'history') && (
              <button className="btn-ink" onClick={() => setComposerOpen(true)} style={{ fontSize: 15, padding: '12px 32px' }}>
                Launch your first post
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 6 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        )}
      </div>

      <ComposerModal isOpen={composerOpen} onClose={() => setComposerOpen(false)} onPostCreated={fetchBroadcasts} />
      <PostPreviewModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}

export default Dashboard;
