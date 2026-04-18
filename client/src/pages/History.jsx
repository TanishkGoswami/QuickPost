import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Image as ImageIcon, 
  Video, 
  Search, 
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Youtube,
  Instagram,
  Facebook,
  Hash,
  Share2
} from 'lucide-react';
import apiClient from '../utils/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function History() {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/broadcasts');
      setBroadcasts(response.data.broadcasts || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-5 h-5 text-[#0A66C2]" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-[#FF0000]" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-[#E4405F]" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-[#1877F2]" />;
      case 'tiktok': return <Share2 className="w-5 h-5 text-black" />;
      case 'mastodon': return <Hash className="w-5 h-5 text-[#6364FF]" />;
      case 'bluesky': return <Share2 className="w-5 h-5 text-[#0085FF]" />;
      case 'pinterest': return <Share2 className="w-5 h-5 text-[#BD081C]" />;
      case 'threads': return <ThreadsIcon className="w-5 h-5" />;
      default: return <Share2 className="w-5 h-5" />;
    }
  };

  const filteredBroadcasts = broadcasts.filter(b => 
    b.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post History</h1>
          <p className="text-gray-600">Review and track your multi-platform broadcasts</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Fetching your story...</p>
        </div>
      ) : filteredBroadcasts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-8">You haven't broadcasted anything yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBroadcasts.map((post) => {
            const platforms = [
              { id: 'linkedin', success: post.linkedin_success, name: 'LinkedIn', error: post.linkedin_error, url: post.linkedin_url },
              { id: 'youtube', success: post.youtube_success, name: 'YouTube', error: post.youtube_error, url: post.youtube_shorts_url || post.youtube_url },
              { id: 'instagram', success: post.instagram_success, name: 'Instagram', error: post.instagram_error, url: post.instagram_url },
              { id: 'facebook', success: post.facebook_success, name: 'Facebook', error: post.facebook_error, url: post.facebook_url },
              { id: 'tiktok', success: post.tiktok_success, name: 'TikTok', error: post.tiktok_error, url: null },
              { id: 'mastodon', success: post.mastodon_success, name: 'Mastodon', error: post.mastodon_error, url: post.mastodon_url },
              { id: 'bluesky', success: post.bluesky_success, name: 'Bluesky', error: post.bluesky_error, url: post.bluesky_url },
              { id: 'pinterest', success: post.pinterest_success, name: 'Pinterest', error: post.pinterest_error, url: post.pinterest_url },
              { id: 'threads', success: post.threads_success, name: 'Threads', error: post.threads_error, url: post.threads_url }
            ].filter(p => p.success || (p.error && p.error !== 'Not selected')); // FILTER OUT NOT SELECTED

            return (
              <div 
                key={post.id} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                  expandedId === post.id ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
                }`}
              >
                <div 
                  className="p-5 flex items-start gap-5 cursor-pointer"
                  onClick={() => toggleExpand(post.id)}
                >
                  {/* Media Preview */}
                  <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative border border-gray-100">
                    {post.media_url ? (
                      <img 
                        src={post.media_url} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image';
                        }}
                      />
                    ) : post.media_type === 'image' || (post.video_filename && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename)) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                        <ImageIcon className="w-8 h-8 text-blue-200 mb-1" />
                        <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Image</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                        <Video className="w-8 h-8 text-white opacity-50 mb-1" />
                        <span className="text-[10px] text-white/50 font-bold uppercase">Video</span>
                      </div>
                    )}
                  </div>

                  {/* Content Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(post.posted_at)}
                      </div>
                      <div className="p-1 bg-gray-50 rounded-full">
                        {expandedId === post.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-3 pr-8">
                      {post.caption || 'Untitled Broadcast'}
                    </h3>
                    
                    {/* Platform Quick Status (Only show attempted ones) */}
                    <div className="flex flex-wrap gap-2">
                      {platforms.map(platform => (
                        <div 
                          key={platform.id}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            platform.success 
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                        >
                          {getPlatformIcon(platform.id)}
                          <span>{platform.name}</span>
                          {platform.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded Breakdown */}
                {expandedId === post.id && (
                  <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {platforms.map(platform => (
                        <div key={platform.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              {getPlatformIcon(platform.id)}
                              <span className="font-bold text-gray-800">{platform.name}</span>
                            </div>
                            {platform.success ? (
                              <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-green-200">Success</span>
                            ) : (
                              <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-red-200">Failed</span>
                            )}
                          </div>
                          
                          {platform.success ? (
                            <div className="space-y-3">
                              {platform.url && (
                                <a 
                                  href={platform.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors group"
                                >
                                  <span>View Live Post</span>
                                  <ExternalLink className="w-3 h-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-50 italic">
                                {platform.error || 'Connection timeout or API error'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Meta Data */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                      <div className="flex-1 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">Full Caption</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.caption || '(Empty caption)'}</p>
                      </div>
                      
                      <div className="w-full md:w-64 p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 w-full border-b border-gray-50 pb-2">Media Data</h4>
                        {post.media_type === 'image' || (post.video_filename && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename)) ? (
                          <ImageIcon className="w-8 h-8 text-blue-100 mb-2" />
                        ) : (
                          <Video className="w-8 h-8 text-blue-100 mb-2" />
                        )}
                        <span className="text-xs font-bold text-gray-600 uppercase">{post.media_type}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-1 break-all">{post.video_filename}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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

export default History;
