import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'gap_cookie_consent';

/**
 * Professional GDPR-style cookie consent banner.
 * Design: glass card, bottom of screen, with Accept / Decline / Manage options.
 * Stores preference in localStorage.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Slight delay so it doesn't appear during page mount flash
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (choice) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      decision: choice,
      analytics: choice === 'all' ? true : prefs.analytics,
      marketing: choice === 'all' ? true : (choice === 'decline' ? false : prefs.marketing),
      timestamp: Date.now(),
    }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop blur on mobile only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99990,
              background: 'rgba(0,0,0,0.1)',
              backdropFilter: 'blur(1px)',
              pointerEvents: 'none',
            }}
            className="sm:hidden"
          />

          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 16,
              left: '50%',
              x: '-50%',
              zIndex: 99991,
              width: 'clamp(300px, calc(100vw - 32px), 680px)',
            }}
          >
            <div style={{
              background: '#FCFBFA',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 'var(--r-hero)',
              border: '1px solid rgba(20,20,19,0.08)',
              boxShadow: '0 24px 60px rgba(20,20,19,0.18)',
              overflow: 'hidden',
              fontFamily: "'Sofia Sans', Arial, sans-serif",
            }}>
              {/* Top accent line — Signal Orange per Mastercard consent pattern */}
              <div style={{ height: 3, background: '#F37338' }} />

              <div style={{ padding: '20px 22px' }}>
                {/* Main row */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Cookie icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: 20, boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
                  }}>
                    🍪
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                      We use cookies
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--slate)', lineHeight: 1.55, fontWeight: 450 }}>
                      We use cookies to personalise content, analyse traffic and improve your experience.
                      {' '}
                      <button
                        onClick={() => setShowDetails(d => !d)}
                        style={{ color: 'var(--link)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      >
                        {showDetails ? 'Hide details' : 'Cookie settings'}
                      </button>
                    </p>
                  </div>
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        marginTop: 14, padding: 14, borderRadius: 'var(--r-btn)',
                        background: 'var(--canvas)', border: '1px solid rgba(20,20,19,0.08)',
                        display: 'flex', flexDirection: 'column', gap: 10,
                      }}>
                        {/* Essential — always on */}
                        <CookieRow
                          label="Essential"
                          desc="Required for the site to function. Cannot be disabled."
                          checked={true}
                          disabled
                        />
                        {/* Analytics */}
                        <CookieRow
                          label="Analytics"
                          desc="Helps us understand how visitors interact with our site."
                          checked={prefs.analytics}
                          onChange={v => setPrefs(p => ({ ...p, analytics: v }))}
                        />
                        {/* Marketing */}
                        <CookieRow
                          label="Marketing"
                          desc="Used to deliver personalised ads and content."
                          checked={prefs.marketing}
                          onChange={v => setPrefs(p => ({ ...p, marketing: v }))}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div style={{
                  display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap',
                  justifyContent: 'flex-end', alignItems: 'center',
                }}>
                  {/* Privacy link */}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11.5, color: '#94a3b8', fontWeight: 600,
                      textDecoration: 'none', marginRight: 'auto',
                      borderBottom: '1px solid #e2e8f0', paddingBottom: 1,
                    }}
                  >
                    Privacy Policy
                  </a>

                  {/* Decline */}
                  <button
                    onClick={() => save('decline')}
                    style={{
                      fontSize: 12.5, fontWeight: 700, color: 'var(--slate)',
                      background: 'transparent', border: '1.5px solid rgba(20,20,19,0.15)',
                      borderRadius: 'var(--r-btn)', padding: '8px 16px', cursor: 'pointer',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(20,20,19,0.30)'; e.currentTarget.style.background = 'var(--canvas)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(20,20,19,0.15)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    Decline all
                  </button>

                  {showDetails && (
                    <button
                      onClick={() => save('custom')}
                      style={{
                        fontSize: 12.5, fontWeight: 700, color: 'var(--signal)',
                        background: 'rgba(207,69,0,0.06)', border: '1.5px solid rgba(207,69,0,0.25)',
                        borderRadius: 'var(--r-btn)', padding: '8px 16px', cursor: 'pointer',
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(207,69,0,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(207,69,0,0.06)'}
                    >
                      Save preferences
                    </button>
                  )}

                  {/* Accept all */}
                  <button
                    onClick={() => save('all')}
                    style={{
                      fontSize: 12.5, fontWeight: 700, color: '#fff',
                      /* Signal Orange — the Mastercard consent/legal color */
                      background: 'var(--signal)',
                      border: 'none', borderRadius: 'var(--r-chip)', padding: '8px 20px',
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: '0 4px 14px rgba(207,69,0,0.30)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CookieRow({ label, desc, checked, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{label}</p>
        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{desc}</p>
      </div>
      {/* Toggle */}
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          flexShrink: 0,
          width: 38, height: 21, borderRadius: 99, border: 'none',
          background: checked ? 'var(--ink)' : 'rgba(20,20,19,0.12)',
          cursor: disabled ? 'default' : 'pointer',
          position: 'relative', transition: 'background 0.2s',
          outline: 'none', padding: 0,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{
          position: 'absolute', top: 2.5, width: 16, height: 16, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
          left: checked ? 19 : 3,
        }} />
      </button>
    </div>
  );
}

/** Utility: check if user has given any consent */
export function getCookieConsent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
