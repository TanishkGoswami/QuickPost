import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, CalendarClock, Plus, Share2, ChevronDown, X } from 'lucide-react';
import { useDialog } from '../context/DialogContext';
import logo from '/logo.png';
import InstagramBusinessSetupModal from './InstagramBusinessSetupModal';
import BlueskyConnectModal from './BlueskyConnectModal';
import PinterestConnectModal from './PinterestConnectModal';
import LinkedInConnectModal from './LinkedInConnectModal';
import MastodonConnectModal from './MastodonConnectModal';
import TikTokConnectModal from './TikTokConnectModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── tiny SVG orbital arc decoration ── */
const OrbitalArc = () => (
  <svg className="orbital-arc" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} aria-hidden="true">
    <path d="M 20 60 Q 120 20 220 80" />
  </svg>
);

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedDashboardPlatform =
    location.pathname === '/dashboard'
      ? new URLSearchParams(location.search).get('platform')
      : null;

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
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    const confirmed = await confirm('Logout', 'Are you sure you want to log out?', {
      intent: 'logout',
      confirmText: 'Logout',
      cancelText: 'Stay logged in'
    });
    if (confirmed) { logout(); navigate('/login'); }
  };

  const handleConnectInstagram = () => setShowBusinessSetupModal(true);
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
    setConnectingPlatform('x');
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/x?token=${token}`;
  };
  const handleConnectReddit = () => {
    setConnectingPlatform('reddit');
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/reddit?token=${token}`;
  };
  const handleDisconnect = async (platform) => {
    const confirmed = await confirm('Disconnect Account', `Are you sure you want to disconnect your ${platform} account? This will stop all scheduled posts to this channel.`, {
      intent: 'danger', confirmText: 'Disconnect', cancelText: 'Keep Connected'
    });
    if (!confirmed) return;
    setDisconnectingPlatform(platform);
    try {
      const token = localStorage.getItem('quickpost_token');
      const response = await fetch(`${API_BASE_URL}/api/auth/disconnect/${platform}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) { await refreshAccounts(); alert('Success', `Successfully disconnected from ${platform}`, { intent: 'primary' }); }
      else { alert('Error', `Failed to disconnect: ${data.error}`, { intent: 'danger' }); }
    } catch (error) {
      alert('Error', 'Failed to disconnect account. Please try again.', { intent: 'danger' });
    } finally { setDisconnectingPlatform(null); }
  };

  const platforms = [
    { id: 'facebook', name: 'Facebook', connected: connectedAccounts.facebook, icon: <img src="/icons/facebook-round-color-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: handleConnectFacebook },
    { id: 'instagram', name: 'Instagram', connected: connectedAccounts.instagram, icon: <img src="/icons/ig-instagram-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: handleConnectInstagram },
    { id: 'x', name: 'X', connected: connectedAccounts.x, icon: <img src="/icons/x-social-media-round-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: handleConnectX },
    { id: 'linkedin', name: 'LinkedIn', connected: connectedAccounts.linkedin, icon: <img src="/icons/linkedin-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => setShowLinkedInModal(true) },
    { id: 'tiktok', name: 'TikTok', connected: connectedAccounts.tiktok, icon: <img src="/icons/tiktok-circle-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => setShowTikTokModal(true) },
    { id: 'youtube', name: 'YouTube', connected: connectedAccounts.youtube, icon: <img src="/icons/youtube-color-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => alert('YouTube is connected via Google sign-in') },
    { id: 'pinterest', name: 'Pinterest', connected: connectedAccounts.pinterest, icon: <img src="/icons/pinterest-round-color-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => setShowPinterestModal(true) },
    { id: 'threads', name: 'Threads', connected: connectedAccounts.threads, icon: <img src="/icons/threads-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: handleConnectThreads },
    { id: 'mastodon', name: 'Mastodon', connected: connectedAccounts.mastodon, icon: <img src="/icons/mastodon-round-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => setShowMastodonModal(true) },
    { id: 'bluesky', name: 'Bluesky', connected: connectedAccounts.bluesky, icon: <img src="/icons/bluesky-circle-color-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => setShowBlueskyModal(true) },
    { id: 'google-business', name: 'Google Business', connected: connectedAccounts.googleBusiness, icon: <img src="/icons/google-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: () => alert('Coming Soon', 'Google Business Profile integration coming soon!', { intent: 'warning' }) },
    { id: 'reddit', name: 'Reddit', connected: connectedAccounts.reddit, icon: <img src="/icons/reddit-icon.svg" style={{width: 20, height: 20}} alt="" />, onConnect: handleConnectReddit, disabled: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="flex flex-col custom-scrollbar"
      style={{
        width: 240,
        height: '100%',
        background: 'var(--canvas)',
        borderRight: '1px solid rgba(20,20,19,0.06)',
      }}
    >
      {/* ── Brand ── */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(20,20,19,0.08)' }}>
        <Link to="/dashboard" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <img src={logo} alt="GAP Social-pilot" style={{ height: 36, width: 36, objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            GAP Social‑pilot
          </span>
        </Link>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '12px 12px 0' }}>

        {/* ── Primary nav ── */}
        <div style={{ marginBottom: 20 }}>
          {[
            {
              to: '/dashboard',
              label: 'All Channels',
              icon: <Share2 size={16} />,
            },
            {
              to: '/dashboard/queue',
              label: 'Scheduled Queue',
              icon: <CalendarClock size={16} />,
            },
          ].map(({ to, label, icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 'var(--r-btn)',
                  marginBottom: 2,
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--canvas)' : 'var(--slate)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(20,20,19,0.05)';
                    e.currentTarget.style.color = 'var(--ink)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--slate)';
                  }
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: active ? 'rgba(255,255,255,0.15)' : 'rgba(20,20,19,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* ── Connected platforms ── */}
        <div style={{ marginTop: 8 }}>
          {(() => {
            const connectedPlatforms = platforms.filter(p => p.connected);
            const visibleIcons = connectedPlatforms.slice(0, 3);
            const extraCount = Math.max(0, connectedPlatforms.length - 3);

            return (
              <button
                onClick={() => setConnectedOpen(!connectedOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '100px',
                  background: 'var(--canvas-lifted)',
                  border: '1px solid rgba(20,20,19,0.08)',
                  cursor: 'pointer',
                  marginBottom: 8,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {visibleIcons.map((p, i) => (
                    <div
                      key={p.id}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--white)',
                        border: '1.5px solid var(--canvas-lifted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: i === 0 ? 0 : -8,
                        zIndex: 3 - i,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {React.cloneElement(p.icon, { style: { width: 14, height: 14 } })}
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--canvas)',
                        border: '1.5px solid var(--canvas-lifted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: -8,
                        zIndex: 0,
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--slate)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      +{extraCount}
                    </div>
                  )}
                </div>
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Connected</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {connectedPlatforms.length > 0 && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                      {connectedPlatforms.length}
                    </div>
                  )}
                  <ChevronDown size={14} style={{ color: 'var(--slate)', transform: connectedOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </div>
              </button>
            );
          })()}

          <AnimatePresence>
            {connectedOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {platforms.filter(p => p.connected).map(platform => {
                  const isSelected = selectedDashboardPlatform === platform.id && location.pathname === '/dashboard';
                  return (
                    <div
                      key={platform.id}
                      onClick={() => navigate(`/dashboard?platform=${platform.id}`)}
                      className="group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 'var(--r-btn)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: isSelected ? 'rgba(20,20,19,0.07)' : 'transparent',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {platform.icon}
                        </div>
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, background: '#22c55e', borderRadius: '50%', border: '1.5px solid var(--canvas)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{platform.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Active</div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Add Channels ── */}
        <div style={{ marginTop: 24, padding: '0 4px' }}>
          <div className="eyebrow" style={{ padding: '0 6px', marginBottom: 12 }}>Connect Channels</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {platforms.filter(p => !p.connected).map(platform => (
              <button
                key={platform.id}
                onClick={platform.onConnect}
                title={`Connect ${platform.name}`}
                style={{
                  width: 42, height: 42, borderRadius: 'var(--r-btn)',
                  background: 'var(--canvas-lifted)', border: '1px dashed rgba(20,20,19,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', opacity: platform.disabled ? 0.4 : 1
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--white)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(20,20,19,0.2)'; e.currentTarget.style.background = 'var(--canvas-lifted)'; }}
              >
                <div style={{ transition: 'all 0.2s', transform: 'scale(1)', filter: 'none', opacity: 1 }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  {platform.icon}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(20,20,19,0.08)', background: 'var(--canvas)' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-btn)', background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)', marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'My Account'}</div>
              <div style={{ fontSize: 10, color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setShowSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, padding: '8px 10px', borderRadius: 'var(--r-btn)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate)', fontSize: 12, fontWeight: 600 }}>
             <Settings size={14} />Settings
          </button>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, padding: '8px 10px', borderRadius: 'var(--r-btn)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
             <LogOut size={14} />Logout
          </button>
        </div>
      </div>

      {/* ── Settings Modal Overlay ── */}
      {showSettings && createPortal(
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
           <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(20,20,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 20, fontWeight: 500 }}>Settings</h2>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '24px 32px' }}>
                 <div className="eyebrow" style={{ marginBottom: 12 }}>Connected Accounts</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {platforms.filter(p => p.connected).map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--r-btn)', background: 'var(--canvas)', border: '1px solid rgba(20,20,19,0.08)' }}>
                        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{p.name}</p>
                        </div>
                        <button onClick={() => handleDisconnect(p.id)} disabled={disconnectingPlatform === p.id} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 'var(--r-btn)', border: '1px solid #dc2626', color: '#dc2626', background: 'none', cursor: 'pointer' }}>
                          {disconnectingPlatform === p.id ? '...' : 'Disconnect'}
                        </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* ── Connection Modals ── */}
      {createPortal(
        <>
          <InstagramBusinessSetupModal isOpen={showBusinessSetupModal} onClose={() => setShowBusinessSetupModal(false)} onProceed={handleProceedToConnect} />
          <BlueskyConnectModal isOpen={showBlueskyModal} onClose={() => setShowBlueskyModal(false)} onSuccess={refreshAccounts} />
          <PinterestConnectModal isOpen={showPinterestModal} onClose={() => setShowPinterestModal(false)} onSuccess={refreshAccounts} />
          <LinkedInConnectModal isOpen={showLinkedInModal} onClose={() => setShowLinkedInModal(false)} onSuccess={refreshAccounts} />
          <MastodonConnectModal isOpen={showMastodonModal} onClose={() => setShowMastodonModal(false)} onSuccess={refreshAccounts} />
          <TikTokConnectModal isOpen={showTikTokModal} onClose={() => setShowTikTokModal(false)} onSuccess={refreshAccounts} />
        </>,
        document.body
      )}
    </aside>
  );
}

export default Sidebar;