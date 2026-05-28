import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AutoDMProvider, useAutoDM } from '../../context/AutoDMContext';
import {
  Home,
  Zap,
  Users,
  Instagram,
  Settings,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  Send,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard/auto-dm', label: 'Home', icon: Home, exact: true },
  { to: '/dashboard/auto-dm/automations', label: 'Automations', icon: Zap },
  { to: '/dashboard/auto-dm/contacts', label: 'Contacts', icon: Users },
  { to: '/dashboard/auto-dm/instagram-profile', label: 'Instagram Profile', icon: Instagram },
  { to: '/dashboard/auto-dm/settings', label: 'Settings', icon: Settings },
];

function AutoDMSidebarInner({ onClose }) {
  const navigate = useNavigate();
  const { autodmAccounts, activeAccount, setActiveAccount, loading, hasSocialInstagramConnection } = useAutoDM();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <aside style={{
      width: 260,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--canvas-lifted)',
      borderRight: '1px solid rgba(20, 20, 19, 0.08)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(20, 20, 19, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-xs)',
            background: 'var(--color-arc-050)',
            border: '1px solid var(--color-arc-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={16} color="var(--arc)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>GAP AutoDM</div>
            <div style={{ fontSize: 10, color: 'var(--slate)', fontWeight: 500 }}>Instagram DM Automation</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Back to Social Pilot */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20, 20, 19, 0.12)',
            background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--slate)',
            fontWeight: 500, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20, 20, 19, 0.04)'; e.currentTarget.style.color = 'var(--ink)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate)'; }}
        >
          <ChevronLeft size={12} />
          Back to Social Pilot
        </button>
      </div>

      {/* Account Switcher */}
      {!loading && autodmAccounts.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(20, 20, 19, 0.08)' }}>
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20, 20, 19, 0.1)',
              background: 'var(--white)', cursor: 'pointer', textAlign: 'left',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--canvas)',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {activeAccount?.profile_picture_url ? (
                <img src={activeAccount.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--arc)' }}>
                  {(activeAccount?.username || activeAccount?.instagram_username)?.[0]?.toUpperCase() || 'I'}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{activeAccount?.username || activeAccount?.instagram_username || 'Select account'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>● Connected</div>
            </div>
            <ChevronDown size={12} color="var(--slate)" style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {accountOpen && autodmAccounts.length > 1 && (
            <div style={{ marginTop: 4, borderRadius: 'var(--r-btn)', border: '1px solid rgba(20, 20, 19, 0.1)', overflow: 'hidden', background: 'var(--white)', boxShadow: 'var(--shadow-card)' }}>
              {autodmAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => { setActiveAccount(acc); setAccountOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: acc.id === activeAccount?.id ? 'var(--color-arc-050)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (acc.id !== activeAccount?.id) e.currentTarget.style.background = 'rgba(20, 20, 19, 0.03)'; }}
                  onMouseLeave={e => { if (acc.id !== activeAccount?.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--canvas)', overflow: 'hidden', flexShrink: 0 }}>
                    {acc.profile_picture_url ? (
                      <img src={acc.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--arc)' }}>
                        {(acc.username || acc.instagram_username)?.[0]?.toUpperCase() || 'I'}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>@{acc.username || acc.instagram_username}</span>
                  {acc.id === activeAccount?.id && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--arc)' }} />}
                </button>
              ))}
            </div>
          )}

          {!hasSocialInstagramConnection && (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <AlertCircle size={12} color="var(--warning)" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 10, color: 'var(--warning)', margin: 0, fontWeight: 500 }}>Connect Instagram in Social Pilot to sync automations.</p>
            </div>
          )}
        </div>
      )}

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className="autodm-sidebar-link"
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(20, 20, 19, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--slate)', fontWeight: 500 }}>
          {hasSocialInstagramConnection
            ? <><Wifi size={12} color="var(--success)" /> Connected to Social Pilot</>
            : <><WifiOff size={12} color="var(--danger)" /> No connection</>}
        </div>
      </div>
    </aside>
  );
}

function AutoDMLayoutInner() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--canvas)', fontFamily: 'var(--font-body)' }}>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 60, width: 36, height: 36,
          display: 'none', alignItems: 'center', justifyContent: 'center',
          background: 'var(--white)', border: '1px solid rgba(20, 20, 19, 0.12)', borderRadius: 'var(--r-btn)', cursor: 'pointer',
        }}
        className="autodm-menu-btn"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20, 20, 19, 0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* Sidebar — desktop fixed, mobile drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s ease',
      }} className="autodm-sidebar">
        <AutoDMSidebarInner onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main scrollable area */}
      <main style={{
        marginLeft: 260, flex: 1, overflowY: 'auto', overflowX: 'hidden',
        minHeight: '100vh', padding: 0,
      }} className="autodm-main">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .autodm-sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--r-btn);
          margin-bottom: 4px;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.15s;
          background: transparent;
          color: var(--slate);
          border: 1px solid transparent;
          font-weight: 500;
        }
        .autodm-sidebar-link:hover {
          background: rgba(20, 20, 19, 0.04);
          color: var(--ink);
        }
        .autodm-sidebar-link.active {
          background: var(--color-arc-050) !important;
          color: var(--ink) !important;
          border-color: var(--color-arc-100) !important;
          font-weight: 600;
        }
        @media (max-width: 1023px) {
          .autodm-sidebar { transform: translateX(-100%); }
          .autodm-sidebar.open { transform: translateX(0); }
          .autodm-menu-btn { display: flex !important; }
          .autodm-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default function AutoDMLayout() {
  return (
    <AutoDMProvider>
      <AutoDMLayoutInner />
    </AutoDMProvider>
  );
}
