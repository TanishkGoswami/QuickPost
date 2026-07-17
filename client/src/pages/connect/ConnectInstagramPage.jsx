import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { autodmSupabase, startAutoDMInstagramOAuth } from '../../services/autodm/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CheckCircle, Shield, Users, Instagram, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConnectInstagramPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [activeInstagramAccount, setActiveInstagramAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [checkingAccounts, setCheckingAccounts] = useState(true);

  const loadAccounts = async () => {
    if (!user?.userId) return;
    try {
      const { data: accounts, error } = await autodmSupabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', user.userId);

      if (error) throw error;

      const connected = (accounts || []).filter(acc => acc.is_connected !== false);
      setInstagramAccounts(connected);
      if (connected.length > 0) {
        setActiveInstagramAccount(connected[0]);
      } else {
        setActiveInstagramAccount(null);
      }
    } catch (e) {
      console.error('[ConnectPage] Failed to load accounts:', e);
    } finally {
      setCheckingAccounts(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      loadAccounts();
    }
  }, [user?.userId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      setIsLoading(false);
      toast.error(decodeURIComponent(error));
    }
  }, [location.search]);

  const handleConnect = async () => {
    if (instagramAccounts.length > 0) {
      toast.error('Instagram already connected. Disconnect first to connect a different account.');
      return;
    }

    if (!user?.userId) {
      toast.error('Please sign in again');
      return;
    }

    setIsLoading(true);

    try {
      const url = await startAutoDMInstagramOAuth(window.location.origin);
      window.location.assign(url);
    } catch (err) {
      console.error('Instagram connect error:', err);
      toast.error(err?.message || 'Failed to start Instagram login');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const accountId = activeInstagramAccount?.id || instagramAccounts[0]?.id;
    if (!accountId) return;

    setIsDisconnecting(true);
    try {
      const { error } = await autodmSupabase
        .from('instagram_accounts')
        .update({ is_connected: false })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Instagram disconnected');
      loadAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Failed to disconnect Instagram');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f7f7',
      padding: 20,
      color: '#1a1a1a',
      fontFamily: 'var(--font, Inter, sans-serif)'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 44,
              height: 40,
              background: '#6366f1',
              color: 'white',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Send size={20} />
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>GAP AutoDM</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Connect Instagram Account</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Link your professional account to start automations.</p>
        </div>

        {/* Trust Card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1', fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} />
            </div>
            <span>Meta-Verified Business Partner</span>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
            We only use official Instagram APIs. Your Instagram account is secure, and you stay in full control.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <CheckCircle size={14} color="#22c55e" />
              <span>Official Meta OAuth login</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <CheckCircle size={14} color="#22c55e" />
              <span>Safe and Secure</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
              <CheckCircle size={14} color="#22c55e" />
              <span>Used by 1000+ creators</span>
            </div>
          </div>
        </div>

        {/* Connect Action */}
        {checkingAccounts ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" size={24} />
          </div>
        ) : instagramAccounts.length > 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>Instagram connected</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  Connected as @{activeInstagramAccount?.username || instagramAccounts[0]?.username}
                </p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/auto-dm')} 
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#6366f1', color: 'white', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Go to Dashboard
              </button>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #fecaca',
                background: '#fef2f2', color: '#dc2626', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6
              }}
            >
              {isDisconnecting && <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={14} />}
              Disconnect Instagram
            </button>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>
              To connect a different Instagram account, disconnect this one first.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                fontSize: 16, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} />
              ) : (
                <Instagram size={18} />
              )}
              Connect Instagram Account
            </button>

            <div style={{ padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
                Supports Business & Creator Accounts
              </p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                Log in directly with Instagram to connect your Business or Creator account.
              </p>
            </div>
          </div>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
