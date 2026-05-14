/**
 * SSOPage.jsx — /social-sso
 *
 * Landing page for inbound SSO from getaipilot.in.
 * Reads ?token= from the URL, sends it to the Express server for
 * verification, then follows the returned Supabase magic-link which
 * creates a real session and redirects to /auth/callback.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SSOPage() {
  const navigate = useNavigate();
  const [status,  setStatus]  = useState('processing');
  const [message, setMessage] = useState('Signing you in from GetAiPilot…');

  useEffect(() => {
    let cancelled = false;

    const processSSO = async () => {
      const token = new URLSearchParams(window.location.search).get('token');

      if (!token) {
        if (!cancelled) {
          setStatus('error');
          setMessage('No SSO token found. Please try launching Social Pilot again from GetAiPilot.');
        }
        return;
      }

      try {
        const res  = await fetch(`${API_URL}/api/auth/sso`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok || !data.magic_link_url) {
          setStatus('error');
          setMessage(data.error || 'Authentication failed. Please try again.');
          return;
        }

        setMessage('Redirecting to your workspace…');
        // Full navigation: Supabase processes the magic-link and redirects
        // back to /auth/callback with session tokens in the URL hash.
        window.location.href = data.magic_link_url;

      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Network error. Please check your connection and try again.');
        }
      }
    };

    processSSO();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      style={{
        minHeight:      '100vh',
        background:     'var(--canvas)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
        fontFamily:     'var(--font-body)',
      }}
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          background:   'var(--canvas-lifted)',
          borderRadius: 'var(--r-xl)',
          padding:      '48px 40px',
          maxWidth:     380,
          width:        '100%',
          textAlign:    'center',
          boxShadow:    'var(--shadow-modal)',
          border:       '1px solid rgba(20,20,19,0.07)',
        }}
      >
        {status === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(243,115,56,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Loader2
                size={28}
                style={{ color: 'var(--arc)', animation: 'spin 0.8s linear infinite' }}
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Signing you in…
              </h2>
              <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
                {message}
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(220,38,38,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={28} style={{ color: 'var(--danger)' }} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Sign-in failed
              </h2>
              <p style={{ fontSize: 14, color: 'var(--slate)', margin: '0 0 20px' }}>
                {message}
              </p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-ghost"
                style={{ fontSize: 13 }}
              >
                <RefreshCw size={13} aria-hidden="true" />
                Sign in manually
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SSOPage;
