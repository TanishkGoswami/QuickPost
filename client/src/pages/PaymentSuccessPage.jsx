import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccessPage() {
  const { user, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    // Force refresh plan from DB so the sidebar badge updates immediately
    const refresh = async () => {
      try {
        await refreshProfile();
      } catch (e) {
        console.warn('[PaymentSuccess] refreshProfile error (non-fatal):', e);
      } finally {
        setRefreshing(false);
      }
    };
    refresh();
  }, [refreshProfile]);

  return (
    <div style={{ 
      minHeight: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 32,
      fontFamily: 'var(--font)'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--canvas-lifted)',
          borderRadius: 'var(--r-hero)',
          padding: 48,
          textAlign: 'center',
          maxWidth: 480,
          border: '1px solid rgba(20,20,19,0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <CheckCircle2 size={40} color="#22c55e" strokeWidth={2.5} />
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Payment Successful!
        </h1>
        <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 8 }}>
          Thank you for upgrading, {user?.name || 'there'}.
        </p>
        {user?.plan && user.plan !== 'Free' && (
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--arc)', marginBottom: 24 }}>
            Plan active: {user.plan} ✓
          </p>
        )}

        <button
          onClick={() => window.location.href = '/dashboard'}
          disabled={refreshing}
          style={{
            background: refreshing ? 'var(--dust)' : 'var(--ink)',
            color: refreshing ? 'var(--slate)' : 'var(--canvas)',
            border: 'none',
            padding: '14px 32px',
            borderRadius: 'var(--r-btn)',
            fontSize: 15,
            fontWeight: 600,
            cursor: refreshing ? 'wait' : 'pointer',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 auto',
          }}
          onMouseEnter={e => { if (!refreshing) e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {refreshing ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Activating plan...</>
          ) : (
            'Return to Dashboard'
          )}
        </button>
      </motion.div>
    </div>
  );
}
