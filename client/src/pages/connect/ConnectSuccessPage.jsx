import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autodmSupabase } from '../../services/autodm/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConnectSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [activeInstagramAccount, setActiveInstagramAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasCompleted = useRef(false);
  const [loadError, setLoadError] = useState(null);
  const [hasConnectedAccount, setHasConnectedAccount] = useState(false);

  useEffect(() => {
    const hydrateAccounts = async () => {
      try {
        setLoadError(null);
        setHasConnectedAccount(false);

        if (!user?.userId) {
          setLoadError('Please log in again to finish connecting Instagram.');
          return;
        }

        const { data: accounts, error } = await autodmSupabase
          .from('instagram_accounts')
          .select('*')
          .eq('user_id', user.userId);

        if (error) {
          console.error('Error hydrating instagram accounts:', error);
          setLoadError('Failed to load Instagram connection. Please retry.');
          return;
        }

        const connectedAccounts = (accounts || []).filter(acc => acc.is_connected !== false);

        if (connectedAccounts.length > 0) {
          setActiveInstagramAccount(connectedAccounts[0]);
          setHasConnectedAccount(true);
        } else {
          setActiveInstagramAccount(null);
          setLoadError('Instagram connected, but no active account was found. Please reconnect.');
        }
      } catch (e) {
        console.error('Unexpected error hydrating instagram accounts:', e);
        setLoadError('Failed to finish Instagram connection. Please retry.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.userId) {
      hydrateAccounts();
    }
  }, [user?.userId]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasConnectedAccount) return;
    if (hasCompleted.current) return;
    hasCompleted.current = true;

    const username = activeInstagramAccount?.username || searchParams.get('username') || 'your account';
    toast.success(`@${username} connected`);
    
    // Refresh parent state or just redirect to dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard/auto-dm', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, hasConnectedAccount, activeInstagramAccount, navigate, searchParams]);

  const fallbackUsername = searchParams.get('username');

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
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
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

        {activeInstagramAccount?.profile_picture_url && (
          <div style={{
            margin: '0 auto 24px',
            width: 96,
            height: 96,
            overflow: 'hidden',
            borderRadius: '50%',
            border: '4px solid #6366f1',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <img
              src={activeInstagramAccount.profile_picture_url}
              alt={activeInstagramAccount.username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Instagram Connected!</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px' }}>
          @{activeInstagramAccount?.username || fallbackUsername || 'your account'} is successfully connected.
        </p>

        <button
          onClick={() => (loadError ? navigate('/connect', { replace: true }) : navigate('/dashboard/auto-dm'))}
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: '#6366f1', color: 'white', fontSize: 15,
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? (
            <>
              <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} />
              Loading...
            </>
          ) : loadError ? (
            'Back to Connect'
          ) : (
            'Finish'
          )}
        </button>

        {loadError && <p style={{ marginTop: 16, fontSize: 13, color: '#dc2626' }}>{loadError}</p>}

        {!loadError && !isLoading && (
          <div style={{
            position: 'fixed', bottom: 16, right: 16, display: 'flex',
            alignItems: 'center', gap: 8, borderRadius: 8, border: '1px solid #e5e7eb',
            background: 'white', padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <CheckCircle size={18} color="#22c55e" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Instagram account connected</span>
          </div>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
