import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, List, Calendar, ChevronDown, ExternalLink, Instagram, Youtube, Clock } from 'lucide-react';
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

  // Handle OAuth callback (Instagram/Pinterest connection success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    
    if (success === 'instagram_connected' || success === 'pinterest_connected') {
      console.log(`✅ ${success.replace('_', ' ')}`);
      // Refresh connected accounts to update UI
      refreshAccounts();
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (error) {
      console.error('❌ OAuth error:', error);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshAccounts]);

  // Fetch broadcasts
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
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">All Channels</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button className="px-3 py-1.5 text-sm bg-white border-r border-gray-200 rounded-l-lg hover:bg-gray-50 flex items-center gap-2">
                <List className="w-4 h-4" />
                List
              </button>
              <button className="px-3 py-1.5 text-sm bg-white rounded-r-lg hover:bg-gray-50 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </button>
            </div>

            <button
              onClick={() => setComposerOpen(true)}
              className="px-4 py-2 bg-buffer-blue hover:bg-buffer-blueDark text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <span>Channels</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading broadcasts...</p>
            </div>
          ) : activeTab === 'sent' && broadcasts.length > 0 ? (
            <div className="space-y-6">
              {/* Group by date */}
              {broadcasts.map((broadcast) => (
                <div key={broadcast.id}>
                  {/* Date Header */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Today, {new Date(broadcast.posted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h3>
                  </div>

                  {/* Broadcast Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {/* Time */}
                    <div className="text-sm text-gray-600 mb-4">{formatTime(broadcast.posted_at)}</div>

                    {/* User Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-sm">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">{user?.name || user?.email}</p>
                          <div className="flex items-center gap-1">
                            {broadcast.youtube_success && (
                              <span className="text-red-600" title="YouTube">
                                <Youtube className="w-4 h-4" />
                              </span>
                            )}
                            {broadcast.instagram_success && (
                              <span className="text-pink-600" title="Instagram">
                                <Instagram className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{broadcast.caption}</p>
                      </div>
                    </div>

                    {/* Platform Results */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      {broadcast.youtube_success && broadcast.youtube_shorts_url && (
                        <a
                          href={broadcast.youtube_shorts_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on YouTube
                        </a>
                      )}
                      {broadcast.instagram_success && broadcast.instagram_url && (
                        <a
                          href={broadcast.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Instagram
                        </a>
                      )}
                    </div>

                    {/* Stats Placeholder */}
                    <div className="flex items-center gap-6 py-3 border-t border-gray-100 text-sm text-gray-500">
                      <span>— Saves</span>
                      <span>— Comments</span>
                      <span>— Impressions</span>
                      <span>— Reactions</span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>You created this {formatDate(broadcast.posted_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-16 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'queue' ? 'No posts scheduled' : activeTab === 'drafts' ? 'No drafts' : 'No posts sent yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'sent' ? 'Create and send your first post to see it here' : 'Schedule some posts and they will appear here'}
                </p>
              </div>

              <button
                onClick={() => setComposerOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-buffer-blue hover:bg-buffer-blueDark text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create your next post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Composer Modal */}
      <ComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPostCreated={(result) => {
          // Refresh broadcasts after successful post
          fetchBroadcasts();
        }}
      />
    </div>
  );
}

export default Dashboard;
