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
  RefreshCw,
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
      background: '#ffffff',
      borderRight: '1px solid #f0f0f0',
      fontFamily: 'var(--font, Inter, sans-serif)',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#fff7f2',
            border: '1px solid rgba(243,115,56,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={16} color="var(--arc)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>GAP AutoDM</div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>Instagram DM Automation</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Back to Social Pilot */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#f9fafb', cursor: 'pointer', fontSize: 12, color: '#6b7280',
            fontWeight: 500, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#1a1a1a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <ChevronLeft size={12} />
          Back to Social Pilot
        </button>
      </div>

      {/* Account Switcher */}
      {!loading && autodmAccounts.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb',
              background: '#f9fafb', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: '#e5e7eb',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {activeAccount?.profile_picture_url ? (
                <img src={activeAccount.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--arc)' }}>
                  {activeAccount?.username?.[0]?.toUpperCase() || 'I'}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{activeAccount?.username || 'Select account'}
              </div>
              <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● Connected</div>
            </div>
            <ChevronDown size={12} color="#9ca3af" style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {accountOpen && autodmAccounts.length > 1 && (
            <div style={{ marginTop: 4, borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {autodmAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => { setActiveAccount(acc); setAccountOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: acc.id === activeAccount?.id ? '#f0f4ff' : '#fff',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                    {acc.profile_picture_url ? (
                      <img src={acc.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6366f1' }}>
                        {acc.username?.[0]?.toUpperCase() || 'I'}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>@{acc.username}</span>
                  {acc.id === activeAccount?.id && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--arc)' }} />}
                </button>
              ))}
            </div>
          )}

          {!hasSocialInstagramConnection && (
            <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 6, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <AlertCircle size={12} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 10, color: '#92400e', margin: 0 }}>Connect Instagram in Social Pilot to sync automations.</p>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 9, marginBottom: 2, textDecoration: 'none',
              background: isActive ? '#fff7f2' : 'transparent',
              color: isActive ? 'var(--ink)' : '#374151',
              border: `1px solid ${isActive ? 'rgba(243,115,56,0.24)' : 'transparent'}`,
              fontWeight: isActive ? 600 : 500, fontSize: 14,
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('255, 247, 242')) { e.currentTarget.style.background = '#f7f5f2'; } }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('255, 247, 242')) { e.currentTarget.style.background = 'transparent'; } }}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
          {hasSocialInstagramConnection
            ? <><Wifi size={12} color="#22c55e" /> Instagram connected via Social Pilot</>
            : <><WifiOff size={12} color="#ef4444" /> Instagram not connected</>}
        </div>
      </div>
    </aside>
  );
}

function AutoDMLayoutInner() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--canvas)', fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 60, width: 36, height: 36,
          display: 'none', alignItems: 'center', justifyContent: 'center',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
        }}
        className="autodm-menu-btn"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
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
