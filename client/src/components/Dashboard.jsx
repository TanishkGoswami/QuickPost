import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Share2,
  CheckCircle2,
  XCircle,
  Video,
  Image as ImageIcon,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  ThumbsUp,
  X
} from "lucide-react";
import apiClient from "../utils/apiClient";
import ComposerModal from "./ComposerModal";
import PostPreviewModal from "./PostPreviewModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  const s = { width: 14, height: 14, objectFit: 'contain' };
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
    case 'google-business': return <img src="/icons/google-icon.svg" style={s} alt="Google" />;
    default:          return <Share2 size={14} />;
  }
}

function buildPlatforms(post) {
  return [
    {
      id: "linkedin",
      name: "LinkedIn",
      success: post.linkedin_success,
      error: post.linkedin_error,
      url: post.linkedin_url,
    },
    {
      id: "youtube",
      name: "YouTube",
      success: post.youtube_success,
      error: post.youtube_error,
      url: post.youtube_shorts_url || post.youtube_url,
    },
    {
      id: "instagram",
      name: "Instagram",
      success: post.instagram_success,
      error: post.instagram_error,
      url: post.instagram_url,
    },
    {
      id: "facebook",
      name: "Facebook",
      success: post.facebook_success,
      error: post.facebook_error,
      url: post.facebook_url,
    },
    {
      id: "tiktok",
      name: "TikTok",
      success: post.tiktok_success,
      error: post.tiktok_error,
      url: null,
    },
    {
      id: "mastodon",
      name: "Mastodon",
      success: post.mastodon_success,
      error: post.mastodon_error,
      url: post.mastodon_url,
    },
    {
      id: "bluesky",
      name: "Bluesky",
      success: post.bluesky_success,
      error: post.bluesky_error,
      url: post.bluesky_url,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      success: post.pinterest_success,
      error: post.pinterest_error,
      url: post.pinterest_url,
    },
    {
      id: "threads",
      name: "Threads",
      success: post.threads_success,
      error: post.threads_error,
      url: post.threads_url,
    },
    {
      id: "x",
      name: "X",
      success: post.x_success,
      error: post.x_error,
      url: post.x_url,
    },
    {
      id: "reddit",
      name: "Reddit",
      success: post.reddit_success,
      error: post.reddit_error,
      url: post.reddit_url,
    },
  ].filter((p) => p.success || (p.error && p.error !== "Not selected"));
}

/* ── Media thumbnail ── */
function MediaThumb({ post, className = '', style = {} }) {
  const isImage = post.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || '');
  const displayUrl = post.thumbnail_url || (isImage ? post.media_url : null);
  return (
    <div className={className} style={{ background: '#e8e2da', overflow: 'hidden', position: 'relative', borderBottom: '1px solid rgba(20,20,19,0.05)', ...style }}>
      {displayUrl ? (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <img src={displayUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', display: 'block' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            onError={e => { e.target.src = 'https://placehold.co/300x300?text=Preview'; }}
          />
          {post.youtube_success && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(1px)' }}>
              <div style={{ width: 44, height: 44, background: '#FF0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(255,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)' }}>
                <Play size={20} style={{ color: '#fff', fill: '#fff', marginLeft: 3 }} />
              </div>
            </div>
          )}
          {/* Subtle bottom gradient for card transition */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(20,20,19,0.04), transparent)' }} />
        </div>
      ) : post.media_type === 'image' ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#e8e2da' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(20,20,19,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon size={22} style={{ color: '#9a9088' }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#9a9088', textTransform: 'uppercase', letterSpacing: '0.12em' }}>No Media</span>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: css.ink }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={22} style={{ color: 'rgba(243,240,238,0.5)' }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(243,240,238,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>No Video</span>
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
  const successCount = platforms.filter((p) => p.success).length;
  const isScheduled = post.status === 'scheduled';
  
  return (
    <div
      onClick={onOpen}
      style={{
        background: css.lifted,
        borderRadius: css.r_hero,
        border: '1.5px solid rgba(20,20,19,0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
      }}
      onMouseEnter={e => { 
        e.currentTarget.style.boxShadow = css.shadow; 
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'rgba(243, 115, 56, 0.2)'; // mc arc subtle highlight
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.02)'; 
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(20,20,19,0.06)';
      }}
    >
      <div style={{ position: 'relative' }}>
        <MediaThumb post={post} style={{ width: '100%', height: 184, borderRadius: 0 }} />
        
        {/* Modern Label-style Badge (Frosted Glass) */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          padding: '4px 12px', borderRadius: css.r_pill,
          background: 'rgba(20,20,19,0.65)', 
          backdropFilter: 'blur(10px)',
          color: css.canvas,
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {post.media_type || 'media'}
        </div>
        
        {/* Count Badge */}
        {platforms.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            padding: '4px 12px', borderRadius: css.r_pill,
            background: 'rgba(255,255,255,0.85)', 
            backdropFilter: 'blur(8px)',
            color: css.ink,
            border: '1px solid rgba(255,255,255,0.5)',
            fontSize: 9, fontWeight: 700,
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isScheduled ? css.arc : '#22c55e' }} />
            {platforms.length} Platform{platforms.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="eyebrow" style={{ fontSize: 10, marginBottom: 12 }}>
          {formatDate(isScheduled ? post.scheduled_for : post.posted_at)}
        </div>
        
        <p style={{ 
          fontSize: 15, fontWeight: 500, color: css.ink, margin: '0 0 16px', lineHeight: 1.5, 
          flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', 
          overflow: 'hidden', letterSpacing: '-0.01em' 
        }}>
          {post.caption || <span style={{ color: css.dust, fontStyle: 'italic', fontWeight: 400 }}>No caption provided</span>}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {platforms.slice(0, 3).map(p => <PlatformBadge key={p.id} platform={p} />)}
          {platforms.length > 3 && (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              padding: '4px 10px', borderRadius: css.r_pill, 
              background: 'rgba(20,20,19,0.04)', color: css.slate,
              fontSize: 10, fontWeight: 700
            }}>
              +{platforms.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── List row ── */
function ListRow({ post, expanded, onToggle, formatDate }) {
  const platforms = buildPlatforms(post);
  const isScheduled = post.status === 'scheduled';
  
  return (
    <div style={{
      background: css.lifted,
      borderRadius: css.r_hero,
      border: `1.5px solid ${expanded ? 'rgba(243, 115, 56, 0.25)' : 'rgba(20,20,19,0.06)'}`,
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: expanded ? css.shadow : '0 4px 15px rgba(0,0,0,0.01)',
    }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }} onClick={onToggle}>
        <MediaThumb post={post} style={{ width: 84, height: 84, borderRadius: 'var(--r-btn)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="eyebrow" style={{ fontSize: 9 }}>
              {formatDate(isScheduled ? post.scheduled_for : post.posted_at)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isScheduled && (
                <div style={{ fontSize: 9, fontWeight: 800, color: css.arc, background: 'rgba(243, 115, 56, 0.08)', padding: '2px 8px', borderRadius: css.r_pill, textTransform: 'uppercase' }}>
                  Scheduled
                </div>
              )}
              {expanded ? <ChevronUp size={16} style={{ color: css.arc }} /> : <ChevronDown size={16} style={{ color: css.slate }} />}
            </div>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 500, color: css.ink, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {post.caption || <span style={{ fontStyle: 'italic', color: css.dust }}>No caption</span>}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {platforms.slice(0, 5).map(p => <PlatformBadge key={p.id} platform={p} />)}
            {platforms.length > 5 && (
              <div style={{ padding: '4px 10px', borderRadius: css.r_pill, background: 'rgba(20,20,19,0.04)', color: css.slate, fontSize: 10, fontWeight: 700 }}>
                +{platforms.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1.5px solid rgba(243, 115, 56, 0.1)', background: 'linear-gradient(to bottom, rgba(243, 115, 56, 0.02), transparent)', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            {platforms.map(p => (
              <div key={p.id} style={{ 
                background: css.white, 
                padding: '16px', 
                borderRadius: css.r_btn, 
                border: '1.2px solid rgba(20,20,19,0.06)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: PLATFORM_COLORS[p.id] || css.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getPlatformIcon(p.id)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: css.ink }}>{p.name}</span>
                  </div>
                  <span style={{ 
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: css.r_pill, 
                    background: p.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', 
                    color: p.success ? '#15803d' : '#b91c1c',
                    border: `1px solid ${p.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                  }}>
                    {p.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {p.success
                  ? p.url
                    ? <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: css.arc, fontWeight: 700, textDecoration: 'none' }}>View Live Post <ExternalLink size={12} /></a>
                    : <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: css.slate, fontWeight: 600 }}><Clock size={12} /> Pending Sync</div>
                  : <p style={{ fontSize: 11, color: '#ef4444', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>{p.error || 'Connection error'}</p>
                }
              </div>
            ))}
          </div>
          {post.caption && (
            <div style={{ background: css.white, padding: '20px', borderRadius: css.r_btn, border: '1.2px solid rgba(243, 115, 56, 0.1)', boxShadow: '0 8px 24px rgba(243, 115, 56, 0.05)' }}>
              <div className="eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Full Caption</div>
              <p style={{ fontSize: 14, color: css.ink, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{post.caption}</p>
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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('sent');
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedPost, setSelectedPost] = useState(null);
  const [queueCount, setQueueCount] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tabs = [
    { id: 'sent',    label: 'Sent',    count: activeTab === 'sent'    ? broadcasts.length : 0 },
    { id: 'queue',   label: 'Queue',   count: activeTab === 'queue'   ? broadcasts.length : (activeTab === 'sent' ? queueCount : 0) },
    { id: 'drafts',  label: 'Drafts',  count: 0 },
    { id: 'history', label: 'History', count: activeTab === 'history' ? broadcasts.length : 0 },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) { refreshAccounts(); window.history.replaceState({}, '', '/dashboard'); }
    apiClient.get('/api/broadcasts/stats').then(r => setQueueCount(r.data.pending || 0)).catch(() => {});
  }, [refreshAccounts]);

  useEffect(() => { 
    fetchBroadcasts(); 
    setCurrentPage(1); 
  }, [activeTab]);
  
  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm]);

  const resetPagination = () => setCurrentPage(1);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      let params = {};
      if (activeTab === 'sent') params.status = 'sent';
      else if (activeTab === 'queue') params.status = 'scheduled';

      const response = await apiClient.get('/api/broadcasts', { params });
      setBroadcasts(response.data.broadcasts || []);
    } catch (err) { setBroadcasts([]); }
    finally { setLoading(false); }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);
  
  const selectedPlatform = searchParams.get('platform') || 'all';

  const filtered = broadcasts.filter(b => {
    const matchesSearch = (b.caption || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedPlatform === 'all') return matchesSearch;
    const matchesPlatform = buildPlatforms(b).some(p => p.id === selectedPlatform);
    return matchesSearch && matchesPlatform;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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
        background: css.lifted,
        borderBottom: '1px solid rgba(20,20,19,0.08)',
        padding: 'clamp(14px, 3vw, 20px) 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 200 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 2 }}>Overview</div>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 600, color: css.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>Analytics</h1>
          </div>
          {selectedPlatform !== 'all' && (
             <div style={{ padding: '4px 10px', background: 'rgba(20,20,19,0.05)', borderRadius: css.r_btn, border: '1px solid rgba(20,20,19,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: css.ink }}>{selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</span>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
             </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setComposerOpen(true)}
            className="btn-ink"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '10px 20px', borderRadius: css.r_pill }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Post</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ 
        background: css.lifted, 
        borderBottom: '1px solid rgba(20,20,19,0.08)', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'clamp(16px, 4vw, 32px)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { if (tab.id === 'queue' && activeTab !== 'queue') { navigate('/dashboard/queue'); return; } setActiveTab(tab.id); }}
              style={{
                padding: '14px 0',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: active ? css.ink : css.slate,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: `2.5px solid ${active ? css.ink : 'transparent'}`,
                marginBottom: -1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: css.r_pill,
                  fontSize: 9,
                  fontWeight: 800,
                  background: active ? css.ink : 'rgba(20,20,19,0.06)',
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
      {(activeTab === 'sent' || activeTab === 'queue' || activeTab === 'history') && !loading && broadcasts.length > 0 && (
        <div style={{ 
          background: css.canvas, 
          borderBottom: '1px solid rgba(20,20,19,0.06)', 
          padding: '12px 16px', 
          display: 'flex', 
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          alignItems: window.innerWidth < 768 ? 'stretch' : 'center', 
          justifyContent: 'space-between', 
          gap: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, overflowX: 'auto', paddingBottom: window.innerWidth < 768 ? 4 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Clock size={14} style={{ color: css.arc }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: css.ink }}>{filtered.length}</span>
              <span style={{ fontSize: 12, color: css.slate }}>{activeTab === 'queue' ? 'scheduled' : 'total'}</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'rgba(20,20,19,0.1)', flexShrink: 0 }} />
            {activeTab !== 'queue' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: css.ink }}>
                  {filtered.filter(b => buildPlatforms(b).some(p => p.success)).length}
                </span>
                <span style={{ fontSize: 12, color: css.slate }}>success</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: window.innerWidth < 768 ? 'stretch' : 'auto' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: css.slate }} />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 16px 8px 32px',
                  background: css.lifted,
                  border: '1px solid rgba(20,20,19,0.1)',
                  borderRadius: css.r_pill,
                  fontSize: 13, color: css.ink, fontFamily: 'var(--font)',
                  outline: 'none', width: '100%',
                }}
              />
            </div>
            <div style={{ display: 'flex', background: css.lifted, border: '1px solid rgba(20,20,19,0.08)', borderRadius: css.r_pill, padding: 3, gap: 2 }}>
              {[
                { mode: 'grid', icon: <LayoutGrid size={13} /> },
                { mode: 'list', icon: <List size={13} /> },
              ].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={`${mode} view`}
                   style={{ padding: '6px 10px', borderRadius: css.r_pill, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', background: viewMode === mode ? css.ink : 'transparent', color: viewMode === mode ? css.canvas : css.slate, transition: 'all 0.2s' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: css.ink, animation: 'mc-float 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: css.slate, margin: 0 }}>Syncing data…</p>
          </div>
        ) : (activeTab === "sent" || activeTab === "queue" || activeTab === "history") && filtered.length > 0 ? (
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
