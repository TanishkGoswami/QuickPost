import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { autodmSupabase, startAutoDMInstagramOAuth } from '../../services/autodm/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CheckCircle, Shield, Instagram, Send } from 'lucide-react';
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

  const trustItems = [
    'Official Meta OAuth login',
    'Business and Creator accounts supported',
    'You can disconnect access anytime',
  ];

  return (
    <main className="autodm-connect">
      <style>{`
        .autodm-connect {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px 18px;
          background: var(--canvas, #f5f1ec);
          color: var(--ink, #111);
          font-family: var(--font, Inter, sans-serif);
        }
        .autodm-panel {
          width: 100%;
          max-width: 520px;
        }
        .autodm-heading {
          margin-bottom: 20px;
          text-align: center;
        }
        .autodm-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          color: var(--ink, #111);
          font-size: 23px;
          font-weight: 700;
        }
        .autodm-mark {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: var(--ink, #111);
          color: #fff;
        }
        .autodm-heading h1 {
          margin: 0 0 8px;
          color: var(--ink, #111);
          font-size: clamp(24px, 4vw, 31px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .autodm-heading p,
        .autodm-card p,
        .autodm-note {
          color: var(--slate, #626260);
        }
        .autodm-card {
          margin-bottom: 12px;
          padding: 20px;
          border: 1px solid var(--dust, #d3cec6);
          border-radius: 8px;
          background: #fff;
          box-shadow: none;
        }
        .autodm-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          color: var(--ink, #111);
          font-size: 15px;
          font-weight: 650;
        }
        .autodm-card-header span:first-child {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fff4e8;
          color: var(--arc, #ff5600);
        }
        .autodm-card p {
          margin: 0 0 16px;
          font-size: 13px;
          line-height: 1.5;
        }
        .autodm-checks {
          display: grid;
          gap: 8px;
        }
        .autodm-checks div {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink, #111);
          font-size: 13px;
        }
        .autodm-checks svg {
          color: #12823b;
          flex-shrink: 0;
        }
        .autodm-actions {
          display: grid;
          gap: 12px;
        }
        .autodm-btn {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 8px;
          border: 1px solid var(--ink, #111);
          background: var(--ink, #111);
          color: #fff;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
        }
        .autodm-btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        .autodm-btn.secondary {
          background: #fff;
          color: var(--ink, #111);
        }
        .autodm-btn.danger {
          border-color: #e4b2aa;
          background: #fff8f6;
          color: #b62216;
        }
        .autodm-connected-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .autodm-connected-head strong {
          display: block;
          margin-bottom: 3px;
          font-size: 14px;
        }
        .autodm-note {
          margin: 12px 0 0;
          font-size: 12px;
          text-align: center;
        }
        .autodm-loading {
          display: flex;
          justify-content: center;
          padding: 22px 0;
          color: var(--arc, #ff5600);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 520px) {
          .autodm-connected-head {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
      <div className="autodm-panel">
        <header className="autodm-heading">
          <div className="autodm-brand">
            <span className="autodm-mark"><Send size={20} /></span>
            <span>GAP AutoDM</span>
          </div>
          <h1>Connect Instagram Account</h1>
          <p>Link a professional Instagram account to start official Meta automations.</p>
        </header>

        <section className="autodm-card">
          <div className="autodm-card-header">
            <span><Shield size={15} /></span>
            <span>Official Meta connection</span>
          </div>
          <p>
            QuickPost uses Instagram's official OAuth and API access. You stay in control of the account connection.
          </p>
          <div className="autodm-checks">
            {trustItems.map((item) => (
              <div key={item}>
                <CheckCircle size={14} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {checkingAccounts ? (
          <div className="autodm-loading">
            <Loader2 className="spin" size={24} />
          </div>
        ) : instagramAccounts.length > 0 ? (
          <section className="autodm-card">
            <div className="autodm-connected-head">
              <div>
                <strong>Instagram connected</strong>
                <p>Connected as @{activeInstagramAccount?.username || instagramAccounts[0]?.username}</p>
              </div>
              <button type="button" className="autodm-btn secondary" onClick={() => navigate('/dashboard/auto-dm')}>
                Go to Dashboard
              </button>
            </div>
            <button type="button" className="autodm-btn danger" onClick={handleDisconnect} disabled={isDisconnecting}>
              {isDisconnecting && <Loader2 className="spin" size={14} />}
              Disconnect Instagram
            </button>
            <p className="autodm-note">To connect a different Instagram account, disconnect this one first.</p>
          </section>
        ) : (
          <div className="autodm-actions">
            <button type="button" className="autodm-btn" onClick={handleConnect} disabled={isLoading}>
              {isLoading ? <Loader2 className="spin" size={18} /> : <Instagram size={18} />}
              Connect Instagram Account
            </button>
            <section className="autodm-card">
              <div className="autodm-card-header">
                <span><Instagram size={15} /></span>
                <span>Business and Creator accounts</span>
              </div>
              <p>Log in directly with Instagram and choose the professional account you want to connect.</p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
