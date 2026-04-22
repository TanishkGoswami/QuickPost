import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          setStatus('success');
          setMessage('Successfully signed in!');
          setTimeout(() => navigate('/dashboard'), 1000);
        } else {
          // If no session after a few seconds, it might be an error or slow
          const timeout = setTimeout(() => {
            setStatus('error');
            setMessage('Authentication failed or took too long.');
            setTimeout(() => navigate('/login'), 3000);
          }, 5000);
          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred during authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--canvas)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font)',
      }}
    >
      <div
        style={{
          background: 'var(--canvas-lifted)',
          borderRadius: 'var(--r-hero)',
          padding: '48px',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(20,20,19,0.07)',
        }}
      >
        {status === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(243,115,56,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--arc)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>Signing you in...</h2>
              <p style={{ color: 'var(--slate)', fontSize: 14 }}>{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={32} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>Success!</h2>
              <p style={{ color: 'var(--slate)', fontSize: 14 }}>{message}</p>
              <p style={{ color: 'var(--dust)', fontSize: 12, marginTop: 16 }}>Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={32} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>Auth Failed</h2>
              <p style={{ color: 'var(--slate)', fontSize: 14 }}>{message}</p>
              <p style={{ color: 'var(--dust)', fontSize: 12, marginTop: 16 }}>Redirecting to login...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
