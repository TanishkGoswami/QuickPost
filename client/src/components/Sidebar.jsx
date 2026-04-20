import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import { useDialog } from '../context/DialogContext';
import logo from '/logo.png';
import InstagramBusinessSetupModal from './InstagramBusinessSetupModal';
import BlueskyConnectModal from './BlueskyConnectModal';
import PinterestConnectModal from './PinterestConnectModal';
import LinkedInConnectModal from './LinkedInConnectModal';
import MastodonConnectModal from './MastodonConnectModal';
import TikTokConnectModal from './TikTokConnectModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, connectedAccounts, refreshAccounts, logout } = useAuth();
  const { confirm, alert } = useDialog();
  const [showBusinessSetupModal, setShowBusinessSetupModal] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState(null);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [connectedOpen, setConnectedOpen] = useState(true);
  const [showMoreUnconnected, setShowMoreUnconnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const handleLogout = async () => {
    const confirmed = await confirm('Logout', 'Are you sure you want to log out?', { 
      intent: 'logout', 
      confirmText: 'Logout',
      cancelText: 'Stay logged in'
    });
    
    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  const handleConnectInstagram = () => {
    // Show setup modal first to ensure user has business account
    setShowBusinessSetupModal(true);
  };

  const handleProceedToConnect = () => {
    setShowBusinessSetupModal(false);
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/instagram?token=${token}`;
  };

  const handleConnectFacebook = () => {
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/facebook?token=${token}`;
  };

  const handleConnectThreads = () => {
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/threads?token=${token}`;
  };

  const handleConnectX = () => {
    console.log('Ã°Ââ€¢Â Initiating X connection...');
    setConnectingPlatform('x');
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/x?token=${token}`;
  };

  const handleConnectReddit = () => {
    console.log('🤖 Initiating Reddit connection...');
    setConnectingPlatform('reddit');
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/reddit?token=${token}`;
  };

  const handleDisconnect = async (platform) => {
    const confirmed = await confirm('Disconnect Account', `Are you sure you want to disconnect your ${platform} account? This will stop all scheduled posts to this channel.`, {
      intent: 'danger',
      confirmText: 'Disconnect',
      cancelText: 'Keep Connected'
    });

    if (!confirmed) return;

    setDisconnectingPlatform(platform);
    try {
      const token = localStorage.getItem('quickpost_token');
      const response = await fetch(`${API_BASE_URL}/api/auth/disconnect/${platform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await refreshAccounts();
        alert('Success', `Successfully disconnected from ${platform}`, { intent: 'primary' });
      } else {
        alert('Error', `Failed to disconnect: ${data.error}`, { intent: 'danger' });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Error', 'Failed to disconnect account. Please try again.', { intent: 'danger' });
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const handleConnectPinterest = () => {
    setShowPinterestModal(true);
  };

  const handleConnectLinkedIn = () => {
    setShowLinkedInModal(true);
  };

  const handleConnectMastodon = () => {
    setShowMastodonModal(true);
  };

  const handleConnectTikTok = () => {
    setShowTikTokModal(true);
  };

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      connected: connectedAccounts.facebook,
      icon: <img src="/icons/facebook-round-color-icon.svg" className="w-6 h-6 object-contain" alt="Facebook" />,
      connectText: 'Connect Facebook',
      onConnect: handleConnectFacebook,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      connected: connectedAccounts.instagram,
      icon: <img src="/icons/ig-instagram-icon.svg" className="w-6 h-6 object-contain" alt="Instagram" />,
      connectText: 'Connect Instagram',
      onConnect: handleConnectInstagram,
    },
    {
      id: 'x',
      name: 'X',
      connected: connectedAccounts.x,
      icon: <img src="/icons/x-social-media-round-icon.svg" className="w-6 h-6 object-contain" alt="X" />,
      connectText: 'Connect X',
      onConnect: handleConnectX,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      connected: connectedAccounts.linkedin,
      icon: <img src="/icons/linkedin-icon.svg" className="w-6 h-6 object-contain" alt="LinkedIn" />,
      connectText: 'Connect LinkedIn',
      onConnect: handleConnectLinkedIn,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      connected: connectedAccounts.tiktok,
      icon: <img src="/icons/tiktok-circle-icon.svg" className="w-6 h-6 object-contain" alt="TikTok" />,
      connectText: 'Connect TikTok',
      onConnect: handleConnectTikTok,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      connected: connectedAccounts.youtube,
      icon: <img src="/icons/youtube-color-icon.svg" className="w-6 h-6 object-contain" alt="YouTube" />,
      connectText: 'Connect YouTube',
      onConnect: () => alert('YouTube is connected via Google sign-in'),
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      connected: connectedAccounts.pinterest,
      icon: <img src="/icons/pinterest-round-color-icon.svg" className="w-6 h-6 object-contain" alt="Pinterest" />,
      connectText: 'Connect Pinterest',
      onConnect: handleConnectPinterest,
    },
    {
      id: 'threads',
      name: 'Threads',
      connected: connectedAccounts.threads,
      icon: <img src="/icons/threads-icon.svg" className="w-6 h-6 object-contain" alt="Threads" />,
      connectText: 'Connect Threads',
      onConnect: handleConnectThreads,
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      connected: connectedAccounts.mastodon,
      icon: <img src="/icons/mastodon-round-icon.svg" className="w-6 h-6 object-contain" alt="Mastodon" />,
      connectText: 'Connect Mastodon',
      onConnect: handleConnectMastodon,
    },
    {
      id: 'bluesky',
      name: 'Bluesky',
      connected: connectedAccounts.bluesky,
      icon: <img src="/icons/bluesky-circle-color-icon.svg" className="w-6 h-6 object-contain" alt="Bluesky" />,
      connectText: 'Connect Bluesky',
      onConnect: () => setShowBlueskyModal(true),
    },
    {
      id: 'google-business',
      name: 'Google Business',
      connected: connectedAccounts.googleBusiness,
      icon: <img src="/icons/google-icon.svg" className="w-6 h-6 object-contain" alt="Google" />,
      connectText: 'Connect Google Business',
      onConnect: () => alert('Google Business Profile integration coming soon!'),
    },
    {
      id: 'reddit',
      name: 'Reddit',
      connected: connectedAccounts.reddit,
      icon: <img src="/icons/reddit-icon.svg" className="w-6 h-6 object-contain" alt="Reddit" />,
      connectText: 'Coming Soon',
      onConnect: () => alert('Coming Soon', 'Reddit integration is currently awaiting API approval. It will be available shortly!', { intent: 'warning' }),
      disabled: true
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      connected: false,
      icon: <img src="/icons/snapchat-square-color-icon.svg" className="w-6 h-6 object-contain" alt="Snapchat" />,
      connectText: 'Coming Soon',
      onConnect: () => alert('Coming Soon', 'Snapchat integration is in development!', { intent: 'warning' }),
      disabled: true
    }
  ];

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src={logo} alt="GAP Social-pilot" className="h-10 w-10 object-contain" />
          <span className="text-[19px] font-bold text-gray-900">GAP Social-pilot</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-3">
        <div className="px-3 mb-1 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              location.pathname === '/dashboard' ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              <svg className={`w-4 h-4 ${location.pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold">All Channels</span>
          </Link>
        </div>

        {/* Connected Section */}
        {platforms.filter(p => p.connected).length > 0 && (
          <div className="px-3 mt-3">
            {(() => {
              const connected = platforms.filter(p => p.connected);
              return (
                <button
                  onClick={() => setConnectedOpen(o => !o)}
                  className="flex items-center justify-between w-full pl-2 pr-4 py-2 mb-1 rounded-full border border-gray-100 bg-white hover:bg-gray-50 shadow-sm transition-all group overflow-hidden"
                >
                  <motion.div layout className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      {!connectedOpen ? (
                        <motion.div
                          key="icons"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex -space-x-4"
                        >
                          {connected.slice(0, 3).map((p, idx) => (
                            <div key={p.id} className="w-7 h-7 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden" style={{ zIndex: 10 - idx }}>
                              <div className="scale-90">{p.icon}</div>
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text-left"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="text-sm font-semibold text-gray-600"
                        >
                          Connected
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  
                  <motion.div layout className="flex items-center gap-1.5 ml-auto">
                    <AnimatePresence>
                      {!connectedOpen && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="text-sm font-semibold text-gray-600"
                        >
                          Connected
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <motion.div
                      animate={{ rotate: connectedOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </motion.div>
                </button>
              );
            })()}

            <AnimatePresence>
              {connectedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-0.5"
                >
                  {platforms.filter(p => p.connected).map((platform) => (
                    <div
                      key={platform.id}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-default"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                          {platform.icon}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate leading-tight">{platform.name}</div>
                        <div className="text-[11px] text-gray-400 truncate leading-tight">{user?.name || user?.email}</div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={disconnectingPlatform === platform.id}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Disconnect"
                      >
                        {disconnectingPlatform === platform.id
                          ? <span className="text-xs">...</span>
                          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Add Channels Section */}
        {(() => {
          const unconnected = platforms.filter(p => !p.connected);
          const visible = unconnected.slice(0, 3);
          const hidden = unconnected.slice(3);
          if (unconnected.length === 0) return null;
          return (
            <div className="px-3 mt-4">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Add Channels</span>
              </div>
              <div className="space-y-0.5">
                {visible.map((platform) => {
                  const isConnecting = connectingPlatform === platform.id;
                  return (
                    <button
                      key={platform.id}
                      onClick={platform.onConnect}
                      disabled={isConnecting}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left hover:bg-gray-50 transition-all disabled:cursor-wait"
                    >
                      <div className={`w-8 h-8 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 transition-all ${
                        isConnecting ? 'opacity-100 animate-pulse' : 'opacity-50 group-hover:opacity-100 group-hover:border-gray-300'
                      }`}>
                        {platform.icon}
                      </div>
                      <span className={`text-sm transition-all ${
                        isConnecting ? 'text-gray-700 font-medium' : 'text-gray-400 group-hover:text-gray-700'
                      }`}>
                        {isConnecting ? 'Connecting...' : platform.name}
                      </span>
                      {!isConnecting && (
                        <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full transition-opacity">
                          Connect
                        </span>
                      )}
                    </button>
                  );
                })}
                {hidden.length > 0 && (
                  <>
                    {showMoreUnconnected && hidden.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={platform.onConnect}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left hover:bg-gray-50 transition-all"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 opacity-50 group-hover:opacity-100 group-hover:border-gray-300 transition-all">
                          {platform.icon}
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-700 transition-colors">{platform.name}</span>
                        <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full transition-opacity">Connect</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowMoreUnconnected(o => !o)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-indigo-500 transition-colors w-full rounded-xl hover:bg-indigo-50"
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform ${showMoreUnconnected ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="font-medium">{showMoreUnconnected ? 'Show less' : `${hidden.length} more platforms`}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">{user.name || 'My Account'}</div>
              <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
        )}

        {/* Settings + Sign out row */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2.5 px-3 flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold">Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 flex-1 py-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold">Sign out</span>
          </button>
        </div>
      </div>


      {/* Settings Modal via Portal */}
      {showSettings && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-gray-900">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Connected Platforms</p>
              {platforms.filter(p => p.connected).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No platforms connected yet.</p>
              ) : (
                <div className="space-y-2">
                  {platforms.filter(p => p.connected).map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">{p.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-green-500 font-medium">Connected</p>
                      </div>
                      <button onClick={() => { handleDisconnect(p.id); }} disabled={disconnectingPlatform === p.id} className="text-[11px] font-semibold px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {disconnectingPlatform === p.id ? 'Removing...' : 'Disconnect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowSettings(false)} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Instagram Business Setup Modal */}
      <InstagramBusinessSetupModal
        isOpen={showBusinessSetupModal}
        onClose={() => setShowBusinessSetupModal(false)}
        onProceed={handleProceedToConnect}
      />

      {/* Bluesky Connect Modal */}
      <BlueskyConnectModal
        isOpen={showBlueskyModal}
        onClose={() => setShowBlueskyModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* Pinterest Connect Modal */}
      <PinterestConnectModal
        isOpen={showPinterestModal}
        onClose={() => setShowPinterestModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* LinkedIn Connect Modal */}
      <LinkedInConnectModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* Mastodon Connect Modal */}
      <MastodonConnectModal
        isOpen={showMastodonModal}
        onClose={() => setShowMastodonModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* TikTok Connect Modal */}
      <TikTokConnectModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
        onSuccess={refreshAccounts}
      />
    </aside>
  );
}

export default Sidebar;
