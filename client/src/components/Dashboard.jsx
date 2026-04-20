import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Calendar, ChevronDown, ChevronUp, ExternalLink,
  Instagram, Youtube, Clock, Linkedin, Facebook, Share2, CheckCircle2,
  XCircle, Video, Image as ImageIcon, Hash as HashIcon, LayoutGrid, List
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import ComposerModal from './ComposerModal';
import PostPreviewModal from './PostPreviewModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Platform helpers ──────────────────────────────────────────────────── */
function getPlatformIcon(id) {
  switch (id) {
    case 'linkedin':  return <Linkedin  className="w-4 h-4 text-[#0A66C2]" />;
    case 'youtube':   return <Youtube   className="w-4 h-4 text-[#FF0000]" />;
    case 'instagram': return <Instagram className="w-4 h-4 text-[#E4405F]" />;
    case 'facebook':  return <Facebook  className="w-4 h-4 text-[#1877F2]" />;
    case 'tiktok':    return <Share2    className="w-4 h-4 text-black"      />;
    case 'mastodon':  return <HashIcon  className="w-4 h-4 text-[#6364FF]" />;
    case 'bluesky':   return <Share2    className="w-4 h-4 text-[#0085FF]" />;
    case 'pinterest': return <Share2    className="w-4 h-4 text-[#BD081C]" />;
    case 'threads':   return <ThreadsIcon className="w-4 h-4" />;
    case 'x': return (
      <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z"/>
      </svg>
    );
    case 'reddit': return (
      <svg className="w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 11.5c0-1.65-1.35-3-3-3-.41 0-.8.08-1.15.22C18.21 7.27 15.71 6.5 13 6.5c-.01 0-.02 0-.03.01l1.32-4.19c.01-.03 0-.07-.02-.1-.02-.03-.05-.05-.08-.05l-4.44.93c-.15-.47-.59-.81-1.11-.81-.66 0-1.2.54-1.2 1.2s.54 1.2 1.2 1.2c.5 0 .93-.31 1.1-.74l3.87-.81-1.1 3.5c-2.73.04-5.24.81-6.85 2.23-.35-.14-.74-.22-1.15-.22-1.65 0-3 1.35-3 3 0 1.25.77 2.32 1.86 2.76-.04.24-.06.49-.06.74 0 3.31 4.03 6 9 6s9-2.69 9-6c0-.25-.02-.5-.06-.74 1.09-.44 1.86-1.51 1.86-2.76zM7.5 14c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm10.5 4.5c-1.84 0-3.48-.96-4.5-2.5-.1-.14-.07-.34.07-.44.15-.1.35-.07.45.07.9 1.37 2.37 2.22 3.98 2.22s3.08-.85 3.98-2.22c.1-.14.3-.17.44-.07.14.1.17.3.07.44-1.02 1.54-2.66 2.5-4.5 2.5zm1.5-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    );
    default: return <Share2 className="w-4 h-4" />;
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

function MediaThumb({ post, className = '' }) {
  const isImage = post.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || '');
  return (
    <div className={`bg-gray-100 overflow-hidden ${className}`}>
      {post.media_url ? (
        <img src={post.media_url} alt="Preview" className="w-full h-full object-cover"
          onError={e => { e.target.src = 'https://via.placeholder.com/300?text=Preview'; }} />
      ) : isImage ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
          <ImageIcon className="w-8 h-8 text-blue-200 mb-1" />
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Image</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <Video className="w-8 h-8 text-white/40 mb-1" />
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Video</span>
        </div>
      )}
    </div>
  );
}

function PlatformBadge({ platform }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
      platform.success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
    }`}>
      {getPlatformIcon(platform.id)}
      <span>{platform.name}</span>
      {platform.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    </div>
  );
}

/* ── Grid Card (click → modal) ────────────────────────────────────────── */
function GridCard({ post, onOpen, formatDate }) {
  const platforms = buildPlatforms(post);
  const successCount = platforms.filter(p => p.success).length;
  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group"
    >
      <div className="relative">
        <MediaThumb post={post} className="w-full h-44" />
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {post.media_type || 'media'}
        </div>
        {successCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {successCount} platform{successCount > 1 ? 's' : ''}
          </div>
        )}
        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            View Preview →
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
          <Calendar className="w-3 h-3" />{formatDate(post.posted_at)}
        </div>
        <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 leading-snug flex-1">
          {post.caption || <span className="text-gray-300 italic">No caption</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map(p => <PlatformBadge key={p.id} platform={p} />)}
        </div>
      </div>
    </div>
  );
}

/* ── List Row ──────────────────────────────────────────────────────────── */
function ListRow({ post, expanded, onToggle, formatDate }) {
  const platforms = buildPlatforms(post);
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
      expanded ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
    }`}>
      <div className="p-5 flex items-start gap-5 cursor-pointer" onClick={onToggle}>
        <MediaThumb post={post} className="w-20 h-20 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3" />{formatDate(post.posted_at)}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-2">{post.caption || 'Untitled Broadcast'}</h3>
          <div className="flex flex-wrap gap-1.5">{platforms.map(p => <PlatformBadge key={p.id} platform={p} />)}</div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30 px-5 pb-5 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {platforms.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">{getPlatformIcon(p.id)}<span className="text-xs font-bold text-gray-800">{p.name}</span></div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    p.success ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                  }`}>{p.success ? 'Success' : 'Failed'}</span>
                </div>
                {p.success && p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 font-bold hover:text-blue-800">
                    View Live Post <ExternalLink className="w-3 h-3" />
                  </a>
                ) : !p.success ? (
                  <p className="text-[10px] text-red-500 italic">{p.error || 'API error'}</p>
                ) : null}
              </div>
            ))}
          </div>
          {post.caption && (
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Caption</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
function Dashboard() {
  const { user, refreshAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState('sent');
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedPost, setSelectedPost] = useState(null);

  const tabs = [
    {
      id: "sent",
      label: "Sent",
      count: activeTab === "sent" ? broadcasts.length : 0,
    },

    { id: "queue", label: "Queue", count: 0 },
    { id: "drafts", label: "Drafts", count: 0 },
    {
      id: "history",
      label: "History",
      count: activeTab === "history" ? broadcasts.length : 0,
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      refreshAccounts();
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshAccounts]);

  useEffect(() => { fetchBroadcasts(); }, [activeTab]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      // 'history' fetches all broadcasts; 'sent' filters by status
      const params = activeTab === 'sent' ? { status: 'sent' } : {};
      const response = await apiClient.get('/api/broadcasts', { params });
      setBroadcasts(response.data.broadcasts || []);
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const filtered = broadcasts.filter(b =>
    b.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Post Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setComposerOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex items-center gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sent Tab: search + view toggle ── */}
      {(activeTab === 'sent' || activeTab === 'history') && !loading && broadcasts.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-700">{broadcasts.length}</span>
              <span className="text-xs text-gray-400">total posts</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-gray-700">
                {broadcasts.filter(b => buildPlatforms(b).some(p => p.success)).length}
              </span>
              <span className="text-xs text-gray-400">successful</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 text-sm transition-all"
              />
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-500 text-sm font-medium">Syncing data...</p>
          </div>
        ) : (activeTab === 'sent' || activeTab === 'history') && filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(post => (
                <GridCard
                  key={post.id}
                  post={post}
                  onOpen={() => setSelectedPost(post)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {filtered.map(post => (
                <div key={post.id} onClick={() => setSelectedPost(post)} className="cursor-pointer">
                  <ListRow
                    post={post}
                    expanded={expandedId === post.id}
                    onToggle={(e) => { e?.stopPropagation(); toggleExpand(post.id); }}
                    formatDate={formatDate}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">
              {activeTab === 'queue' ? 'Your queue is empty'
                : activeTab === 'drafts' ? 'No drafts yet'
                : activeTab === 'history' ? 'No broadcast history yet'
                : 'Ready for your first boost?'}
            </h3>
            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
              {activeTab === 'sent' || activeTab === 'history'
                ? 'Create a post and broadcast it across your social channels to see analytics here.'
                : 'Schedule posts to see them appear here.'}
            </p>
            {(activeTab === 'sent' || activeTab === 'history') && (
              <button
                onClick={() => setComposerOpen(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200"
              >
                Launch your first post
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

/* ── Threads icon ──────────────────────────────────────────────────────── */
function ThreadsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.74-1.763-.507-.598-1.256-.918-2.228-.952-1.281-.046-2.345.335-3.265 1.169l-1.207-1.555c1.319-1.025 2.971-1.531 4.915-1.504 1.5.054 2.682.567 3.513 1.525.799.921 1.276 2.13 1.427 3.598.433.086.838.186 1.212.298 1.438.433 2.455 1.098 3.026 1.977.638 1 .76 2.352.35 3.908-.54 2.055-1.906 3.753-3.838 4.781-1.558.828-3.394 1.256-5.462 1.277z" />
    </svg>
  );
}

export default Dashboard;
