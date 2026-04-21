import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, CalendarClock } from 'lucide-react';
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
  const [showMoreUnconnected, setShowMoreUnconnected] = useState(false);
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
  const handleConnectPinterest = () => setShowPinterestModal(true);
  const handleConnectLinkedIn  = () => setShowLinkedInModal(true);
  const handleConnectMastodon  = () => setShowMastodonModal(true);
  const handleConnectTikTok    = () => setShowTikTokModal(true);

  const platforms = [
    { id: 'facebook', name: 'Facebook', connected: connectedAccounts.facebook, icon: <img src="/icons/facebook-round-color-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectFacebook },
    { id: 'instagram', name: 'Instagram', connected: connectedAccounts.instagram, icon: <img src="/icons/ig-instagram-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectInstagram },
    { id: 'x', name: 'X', connected: connectedAccounts.x, icon: <img src="/icons/x-social-media-round-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectX },
    { id: 'linkedin', name: 'LinkedIn', connected: connectedAccounts.linkedin, icon: <img src="/icons/linkedin-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectLinkedIn },
    { id: 'tiktok', name: 'TikTok', connected: connectedAccounts.tiktok, icon: <img src="/icons/tiktok-circle-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectTikTok },
    { id: 'youtube', name: 'YouTube', connected: connectedAccounts.youtube, icon: <img src="/icons/youtube-color-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: () => alert('YouTube is connected via Google sign-in') },
    { id: 'pinterest', name: 'Pinterest', connected: connectedAccounts.pinterest, icon: <img src="/icons/pinterest-round-color-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectPinterest },
    { id: 'threads', name: 'Threads', connected: connectedAccounts.threads, icon: <img src="/icons/threads-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectThreads },
    { id: 'mastodon', name: 'Mastodon', connected: connectedAccounts.mastodon, icon: <img src="/icons/mastodon-round-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: handleConnectMastodon },
    { id: 'bluesky', name: 'Bluesky', connected: connectedAccounts.bluesky, icon: <img src="/icons/bluesky-circle-color-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: () => setShowBlueskyModal(true) },
    { id: 'google-business', name: 'Google Business', connected: connectedAccounts.googleBusiness, icon: <img src="/icons/google-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: () => alert('Google Business Profile integration coming soon!') },
    { id: 'reddit', name: 'Reddit', connected: connectedAccounts.reddit, icon: <img src="/icons/reddit-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: () => alert('Coming Soon', 'Reddit integration is currently awaiting API approval.', { intent: 'warning' }), disabled: true },
    { id: 'snapchat', name: 'Snapchat', connected: false, icon: <img src="/icons/snapchat-square-color-icon.svg" className="w-5 h-5 object-contain" alt="" />, onConnect: () => alert('Coming Soon', 'Snapchat integration is in development!', { intent: 'warning' }), disabled: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col custom-scrollbar"
      style={{
        width: 240,
        background: 'var(--canvas)',
        borderRight: '1px solid rgba(20,20,19,0.08)',
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
        <div style={{ marginBottom: 8 }}>
          {[
            {
              to: '/dashboard',
              label: 'All Channels',
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ),
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
                  fontWeight: 500,
                  fontSize: 14,
                  letterSpacing: '-0.01em',
                  textDecoration: 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { 
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(20,20,19,0.06)'; 
                    e.currentTarget.style.color = 'var(--ink)'; 
                  }
                }}
                onMouseLeave={e => { 
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'; 
                    e.currentTarget.style.color = 'var(--slate)'; 
                  } else {
                    e.currentTarget.style.color = 'var(--canvas)';
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
        {platforms.filter(p => p.connected).length > 0 && (
          <div style={{ marginTop: 8 }}>
            {(() => {
              const connected = platforms.filter(p => p.connected);
              return (
                <button
                  onClick={() => setConnectedOpen(o => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '7px 10px 7px 8px',
                    marginBottom: 4,
                    borderRadius: 'var(--r-pill)',
                    border: '1px solid rgba(20,20,19,0.10)',
                    background: 'var(--canvas-lifted)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-nav)',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <motion.div layout style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AnimatePresence mode="wait">
                      {!connectedOpen ? (
                        <motion.div
                          key="icons"
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                          style={{ display: 'flex', marginLeft: -4 }}
                        >
                          {connected.slice(0, 4).map((p, idx) => (
                            <div key={p.id} style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--white)', border: '1.5px solid rgba(20,20,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: idx === 0 ? 0 : -8, zIndex: 10 - idx, flexShrink: 0 }}>
                              {p.icon}
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Connected
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div animate={{ rotate: connectedOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>
              );
            })()}

            <AnimatePresence>
              {connectedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
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
                          marginBottom: 2, 
                          cursor: 'pointer', 
                          transition: 'background 0.15s, border-color 0.15s',
                          background: isSelected ? 'rgba(20,20,19,0.06)' : 'transparent',
                          border: isSelected ? '1px solid rgba(20,20,19,0.08)' : '1px solid transparent'
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(20,20,19,0.04)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {platform.icon}
                          </div>
                          <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '2px solid var(--canvas)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{platform.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{user?.name || user?.email}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDisconnect(platform.id); }}
                          disabled={disconnectingPlatform === platform.id}
                          style={{ opacity: 0, padding: '3px 6px', borderRadius: 6, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', transition: 'opacity 0.2s' }}
                          className="group-hover:opacity-100"
                          title="Disconnect"
                        >
                          {disconnectingPlatform === platform.id
                            ? <span style={{ fontSize: 9 }}>...</span>
                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          }
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Add Channels ── */}
        {(() => {
          const unconnected = platforms.filter(p => !p.connected);
          const visible = unconnected.slice(0, 3);
          const hidden = unconnected.slice(3);
          if (unconnected.length === 0) return null;
          return (
            <div style={{ marginTop: 16 }}>
              <div className="eyebrow" style={{ padding: '0 10px', marginBottom: 6 }}>Add Channels</div>
              <div>
                {visible.map((platform) => {
                  const isConnecting = connectingPlatform === platform.id;
                  return (
                    <button
                      key={platform.id}
                      onClick={platform.onConnect}
                      disabled={isConnecting || platform.disabled}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 'var(--r-btn)',
                        width: '100%', textAlign: 'left', border: 'none',
                        background: 'transparent', cursor: platform.disabled ? 'default' : 'pointer',
                        marginBottom: 2, transition: 'background 0.15s',
                        opacity: platform.disabled ? 0.45 : 1,
                      }}
                      onMouseEnter={e => { if (!platform.disabled) e.currentTarget.style.background = 'rgba(20,20,19,0.04)'; }}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--canvas-lifted)', border: '1px dashed rgba(20,20,19,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {platform.icon}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)' }}>
                        {isConnecting ? 'Connecting…' : platform.name}
                        {platform.disabled && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--arc)', marginLeft: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}> Soon</span>}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'var(--ink)', background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.10)', borderRadius: 'var(--r-pill)', padding: '2px 8px', opacity: 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
                        className="group-hover:opacity-100">
                        + Connect
                      </span>
                    </button>
                  );
                })}
                {hidden.length > 0 && (
                  <>
                    {showMoreUnconnected && hidden.map(platform => (
                      <button
                        key={platform.id}
                        onClick={platform.onConnect}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-btn)', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', marginBottom: 2, opacity: platform.disabled ? 0.4 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,20,19,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--canvas-lifted)', border: '1px dashed rgba(20,20,19,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {platform.icon}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)' }}>{platform.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowMoreUnconnected(o => !o)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 'var(--r-btn)', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate)', fontSize: 12, fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}
                    >
                      <svg style={{ transform: showMoreUnconnected ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      {showMoreUnconnected ? 'Show less' : `${hidden.length} more platforms`}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
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
          {[
            { icon: <Settings size={14} />, label: 'Settings', onClick: () => setShowSettings(true), danger: false },
            { icon: <LogOut size={14} />, label: 'Sign out', onClick: handleLogout, danger: true },
          ].map(({ icon, label, onClick, danger }) => (
            <button key={label} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, padding: '7px 10px', borderRadius: 'var(--r-btn)', border: 'none', background: 'transparent', cursor: 'pointer', color: danger ? '#dc2626' : 'var(--slate)', fontSize: 12, fontWeight: 600, transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = danger ? '#fef2f2' : 'rgba(20,20,19,0.05)'; e.currentTarget.style.color = danger ? '#dc2626' : 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? '#dc2626' : 'var(--slate)'; }}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && createPortal(
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid rgba(20,20,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Account</div>
                <h2 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(20,20,19,0.12)', background: 'var(--canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: '20px 32px' }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Connected Platforms</div>
              {platforms.filter(p => p.connected).length === 0 ? (
                <p style={{ color: 'var(--slate)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No platforms connected yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {platforms.filter(p => p.connected).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--r-btn)', background: 'var(--canvas)', border: '1px solid rgba(20,20,19,0.08)' }}>
                      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Connected</p>
                      </div>
                      <button onClick={() => handleDisconnect(p.id)} disabled={disconnectingPlatform === p.id}
                        style={{ fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 'var(--r-btn)', border: '1.5px solid #dc2626', color: '#dc2626', background: 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {disconnectingPlatform === p.id ? 'Removing…' : 'Disconnect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 32px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSettings(false)} className="btn-outline" style={{ fontSize: 14 }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Platform Modals ── */}
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
