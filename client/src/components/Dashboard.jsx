import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, List, Calendar, ChevronDown, ExternalLink, Instagram, Youtube, Clock, 
  Linkedin, Facebook, Share2, CheckCircle2, XCircle, Video, Image as ImageIcon,
  Hash as HashIcon
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import ComposerModal from './ComposerModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Dashboard() {
  const { user, connectedAccounts, refreshAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState('sent');
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  const tabs = [
    { id: 'queue', label: 'Queue', count: 0 },
    { id: 'drafts', label: 'Drafts', count: 0 },
    { id: 'sent', label: 'Sent', count: broadcasts.length },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    if (success) {
      refreshAccounts();
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshAccounts]);

  useEffect(() => {
    fetchBroadcasts();
  }, [activeTab]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const params = activeTab === 'sent' ? { status: 'sent' } : {};
      const response = await apiClient.get('/api/broadcasts', { params });
      setBroadcasts(response.data.broadcasts || []);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
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

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm font-medium">Syncing data...</p>
            </div>
          ) : activeTab === 'sent' && broadcasts.length > 0 ? (
            <div className="space-y-6">
              {broadcasts.map((broadcast) => {
                const platforms = [
                  { id: 'linkedin', success: broadcast.linkedin_success, name: 'LinkedIn', error: broadcast.linkedin_error, icon: <Linkedin className="w-4 h-4" /> },
                  { id: 'youtube', success: broadcast.youtube_success, name: 'YouTube', error: broadcast.youtube_error, icon: <Youtube className="w-4 h-4" /> },
                  { id: 'instagram', success: broadcast.instagram_success, name: 'Instagram', error: broadcast.instagram_error, icon: <Instagram className="w-4 h-4" /> },
                  { id: 'facebook', success: broadcast.facebook_success, name: 'Facebook', error: broadcast.facebook_error, icon: <Facebook className="w-4 h-4" /> },
                  { id: 'tiktok', success: broadcast.tiktok_success, name: 'TikTok', error: broadcast.tiktok_error, icon: <Share2 className="w-4 h-4" /> },
                  { id: 'mastodon', success: broadcast.mastodon_success, name: 'Mastodon', error: broadcast.mastodon_error, icon: <HashIcon className="w-4 h-4" /> },
                  { id: 'bluesky', success: broadcast.bluesky_success, name: 'Bluesky', error: broadcast.bluesky_error, icon: <Share2 className="w-4 h-4" /> },
                  { id: 'pinterest', success: broadcast.pinterest_success, name: 'Pinterest', error: broadcast.pinterest_error, icon: <Share2 className="w-4 h-4" /> },
                  { id: 'threads', success: broadcast.threads_success, name: 'Threads', error: broadcast.threads_error, icon: <ThreadsIcon className="w-4 h-4" /> }
                ].filter(p => p.success || (p.error && p.error !== 'Not selected'));

                const isImageFile = broadcast.video_filename && /\.(jpg|jpeg|png|gif|webp)$/i.test(broadcast.video_filename);
                const isExplicitImage = broadcast.media_type === 'image';
                const showImage = isExplicitImage || isImageFile;

                return (
                  <div key={broadcast.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex gap-6">
                      {/* Media (Left) */}
                      <div className="w-32 h-32 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 relative shadow-inner">
                        {showImage ? (
                          broadcast.media_url ? (
                            <img 
                              src={broadcast.media_url} 
                              alt="Post" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Preview'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 group-hover:bg-blue-100 transition-colors">
                              <ImageIcon className="w-10 h-10 text-blue-200 mb-1" />
                              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Image</span>
                            </div>
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 group-hover:bg-gray-800 transition-colors">
                            <Video className="w-10 h-10 text-white/40 mb-1" />
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Video</span>
                          </div>
                        )}
                      </div>

                      {/* Info (Right) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-blue-100">
                               {user?.name?.charAt(0) || 'U'}
                             </div>
                             <p className="text-sm font-bold text-gray-800 tracking-tight">{user?.name || user?.email}</p>
                           </div>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(broadcast.posted_at)}</span>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
                          {broadcast.caption || <span className="italic text-gray-300">No caption provided</span>}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          {platforms.map(p => (
                            <div key={p.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
                              p.success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                            }`}>
                              {p.icon}
                              <span className="text-[10px] font-bold">{p.name}</span>
                              {p.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">Ready for your first boost?</h3>
              <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Create a post and broadcast it across your social channels to see real-time analytics here.</p>
              <button
                onClick={() => setComposerOpen(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200"
              >
                Launch your first post
              </button>
            </div>
          )}
        </div>
      </div>

      <ComposerModal isOpen={composerOpen} onClose={() => setComposerOpen(false)} onPostCreated={fetchBroadcasts} />
    </div>
  );
}

function ThreadsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.74-1.763-.507-.598-1.256-.918-2.228-.952-1.281-.046-2.345.335-3.265 1.169l-1.207-1.555c1.319-1.025 2.971-1.531 4.915-1.504 1.5.054 2.682.567 3.513 1.525.799.921 1.276 2.13 1.427 3.598.433.086.838.186 1.212.298 1.438.433 2.455 1.098 3.026 1.977.638 1 .76 2.352.35 3.908-.54 2.055-1.906 3.753-3.838 4.781-1.558.828-3.394 1.256-5.462 1.277z" />
    </svg>
  );
}

export default Dashboard;
