import React, { useState, useEffect } from 'react';
import { useAutoDM } from '../../context/AutoDMContext';
import { Instagram, Users, Image, Heart, MessageCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export default function AutoDMInstagramProfilePage() {
  const { activeAccount, autodmAccounts, setActiveAccount, hasSocialInstagramConnection, importInstagram } = useAutoDM();
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const { fetchInstagramMedia } = useAutoDM();

  useEffect(() => {
    if (activeAccount?.id) loadMedia();
  }, [activeAccount?.id]);

  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const data = await fetchInstagramMedia(24);
      setMedia(data);
    } catch (e) {
      console.error(e);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      await importInstagram();
    } catch (e) {
      setImportError(e.response?.data?.error || e.message);
    } finally {
      setImporting(false);
    }
  };

  if (!activeAccount) {
    return (
      <div style={{ maxWidth: 640, margin: '56px auto', textAlign: 'center', background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)', borderRadius: 'var(--r-card)', padding: '44px 28px', boxShadow: 'var(--shadow-premium)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-arc-050)', border: '1px solid var(--color-arc-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Instagram size={28} color="var(--arc)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No Instagram Account</h2>
        <p style={{ color: 'var(--slate)', margin: '0 0 20px', fontSize: 14 }}>
          {hasSocialInstagramConnection
            ? 'Import your Instagram account to see your profile here.'
            : 'Connect Instagram in Social Pilot, then import it here.'}
        </p>
        {importError && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--r-btn)', marginBottom: 16, display: 'flex', gap: 8 }}>
            <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0, fontWeight: 500 }}>{importError}</p>
          </div>
        )}
        {hasSocialInstagramConnection && (
          <button onClick={handleImport} disabled={importing} className="btn-arc" style={{ padding: '10px 24px', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1 }}>
            {importing ? 'Importing...' : 'Import Instagram Account'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow" style={{ margin: '0 0 6px' }}>GAP AutoDM</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Instagram Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="card-shadow" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--arc) 0%, var(--signal) 100%)', padding: 3 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: 'var(--white)' }}>
                {activeAccount.profile_picture_url ? (
                  <img src={activeAccount.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--arc) 0%, var(--signal) 100%)', color: 'var(--white)', fontSize: 26, fontWeight: 700 }}>
                    {(activeAccount.username || activeAccount.instagram_username)?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)' }}>@{activeAccount.username || activeAccount.instagram_username}</h2>
              <a href={`https://instagram.com/${activeAccount.username || activeAccount.instagram_username}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--slate)', display: 'inline-flex', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--arc)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}>
                <ExternalLink size={14} />
              </a>
            </div>
            {activeAccount.full_name && <p style={{ color: 'var(--slate)', margin: '0 0 8px', fontSize: 14, fontWeight: 500 }}>{activeAccount.full_name}</p>}
            <span className="badge badge-arc">
              {activeAccount.account_type || 'BUSINESS'}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Followers', value: activeAccount.followers_count, icon: Users, color: 'var(--arc)' },
              { label: 'Media', value: activeAccount.media_count, icon: Image, color: 'var(--signal)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <Icon size={18} color={color} style={{ marginBottom: 4 }} />
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                  {value != null ? value.toLocaleString() : '—'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 600, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account selector if multiple */}
        {autodmAccounts.length > 1 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(20,20,19,0.08)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', letterSpacing: '0.04em', margin: '0 0 10px' }}>CONNECTED ACCOUNTS</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {autodmAccounts.map(acc => {
                const isActive = acc.id === activeAccount.id;
                return (
                  <button key={acc.id} onClick={() => setActiveAccount(acc)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                    borderRadius: 'var(--r-btn)', border: `1.5px solid ${isActive ? 'var(--arc)' : 'rgba(20,20,19,0.12)'}`,
                    background: isActive ? 'var(--color-arc-050)' : 'transparent',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: isActive ? 'var(--arc)' : 'var(--slate)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(20,20,19,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--canvas)', overflow: 'hidden' }}>
                      {acc.profile_picture_url ? <img src={acc.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    @{acc.username || acc.instagram_username}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)' }}>Recent Posts</h3>
          <button onClick={loadMedia} disabled={mediaLoading} className="btn-ghost" style={{
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <RefreshCw size={12} style={{ animation: mediaLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {mediaLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton-shimmer" style={{ aspectRatio: '1' }} />)}
          </div>
        ) : media.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--slate)' }}>
            <Image size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>No posts found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {media.map(item => (
              <a key={item.id} href={item.permalink} target="_blank" rel="noopener noreferrer"
                style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', display: 'block', aspectRatio: '1', textDecoration: 'none' }}>
                <img
                  src={item.thumbnail_url || item.media_url}
                  alt={item.caption || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Hover overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,19,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,20,19,0.6)'; e.currentTarget.querySelectorAll('span').forEach(s => s.style.opacity = '1'); }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,20,19,0)'; e.currentTarget.querySelectorAll('span').forEach(s => s.style.opacity = '0'); }}>
                  {item.like_count != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: 12, fontWeight: 700, opacity: 0, transition: 'opacity 0.2s' }}><Heart size={12} /> {item.like_count}</span>}
                  {item.comments_count != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: 12, fontWeight: 700, opacity: 0, transition: 'opacity 0.2s' }}><MessageCircle size={12} /> {item.comments_count}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
