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
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Instagram size={28} color="white" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>No Instagram Account</h2>
        <p style={{ color: '#6b7280', margin: '0 0 20px' }}>
          {hasSocialInstagramConnection
            ? 'Import your Instagram account to see your profile here.'
            : 'Connect Instagram in Social Pilot, then import it here.'}
        </p>
        {importError && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8 }}>
            <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>{importError}</p>
          </div>
        )}
        {hasSocialInstagramConnection && (
          <button onClick={handleImport} disabled={importing} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #f58529, #dd2a7b)',
            color: '#fff', fontWeight: 600, fontSize: 14, cursor: importing ? 'not-allowed' : 'pointer',
            opacity: importing ? 0.7 : 1,
          }}>
            {importing ? 'Importing...' : 'Import Instagram Account'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>GAP AutoDM</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Instagram Profile</h1>
      </div>

      {/* Profile Card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af)', padding: 3 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
                {activeAccount.profile_picture_url ? (
                  <img src={activeAccount.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f58529, #dd2a7b)', color: '#fff', fontSize: 26, fontWeight: 700 }}>
                    {activeAccount.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>@{activeAccount.username}</h2>
              <a href={`https://instagram.com/${activeAccount.username}`} target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af' }}>
                <ExternalLink size={14} />
              </a>
            </div>
            {activeAccount.full_name && <p style={{ color: '#6b7280', margin: '0 0 4px', fontSize: 14 }}>{activeAccount.full_name}</p>}
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#f0f4ff', padding: '2px 8px', borderRadius: 6 }}>
              {activeAccount.account_type || 'BUSINESS'}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Followers', value: activeAccount.followers_count, icon: Users, color: '#6366f1' },
              { label: 'Media', value: activeAccount.media_count, icon: Image, color: '#8b5cf6' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <Icon size={18} color={color} style={{ marginBottom: 4 }} />
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                  {value != null ? value.toLocaleString() : '—'}
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account selector if multiple */}
        {autodmAccounts.length > 1 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '0 0 10px' }}>CONNECTED ACCOUNTS</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {autodmAccounts.map(acc => (
                <button key={acc.id} onClick={() => setActiveAccount(acc)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                  borderRadius: 9, border: `1.5px solid ${acc.id === activeAccount.id ? '#6366f1' : '#e5e7eb'}`,
                  background: acc.id === activeAccount.id ? '#f0f4ff' : '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: acc.id === activeAccount.id ? '#6366f1' : '#374151',
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden' }}>
                    {acc.profile_picture_url ? <img src={acc.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  @{acc.username}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Recent Posts</h3>
          <button onClick={loadMedia} disabled={mediaLoading} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151',
          }}>
            <RefreshCw size={12} style={{ animation: mediaLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {mediaLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ aspectRatio: '1', borderRadius: 10, background: '#f3f4f6', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : media.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
            <Image size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 14, margin: 0 }}>No posts found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {media.map(item => (
              <a key={item.id} href={item.permalink} target="_blank" rel="noopener noreferrer"
                style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', display: 'block', aspectRatio: '1', textDecoration: 'none' }}>
                <img
                  src={item.thumbnail_url || item.media_url}
                  alt={item.caption || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Hover overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.querySelectorAll('span').forEach(s => s.style.opacity = '1'); }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelectorAll('span').forEach(s => s.style.opacity = '0'); }}>
                  {item.like_count != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: 12, fontWeight: 700, opacity: 0, transition: 'opacity 0.2s' }}><Heart size={12} /> {item.like_count}</span>}
                  {item.comments_count != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: 12, fontWeight: 700, opacity: 0, transition: 'opacity 0.2s' }}><MessageCircle size={12} /> {item.comments_count}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
