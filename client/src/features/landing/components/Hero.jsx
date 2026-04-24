import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ArrowRight } from 'lucide-react';

const PLATFORMS = [
  { src: '/icons/ig-instagram-icon.svg',           label: 'Instagram' },
  { src: '/icons/youtube-color-icon.svg',          label: 'YouTube' },
  { src: '/icons/x-social-media-round-icon.svg',  label: 'X' },
  { src: '/icons/linkedin-icon.svg',              label: 'LinkedIn' },
  { src: '/icons/tiktok-circle-icon.svg',         label: 'TikTok' },
  { src: '/icons/facebook-round-color-icon.svg',  label: 'Facebook' },
  { src: '/icons/pinterest-round-color-icon.svg', label: 'Pinterest' },
  { src: '/icons/threads-icon.svg',               label: 'Threads' },
  { src: '/icons/bluesky-circle-color-icon.svg',  label: 'Bluesky' },
  { src: '/icons/mastodon-round-icon.svg',        label: 'Mastodon' },
];

const STATS = [
  { value: '11+', label: 'Platforms', sub: 'All major networks' },
  { value: '1-click', label: 'Broadcast', sub: 'Write once, post everywhere' },
  { value: '∞', label: 'Scheduling', sub: 'No post limits' },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-bg landing-section" style={{ padding: 'clamp(56px, 12vh, 110px) 24px 80px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '60%',
        width: '50vw', height: '70vh',
        background: 'radial-gradient(ellipse 55% 50% at 60% 40%, rgba(243,115,56,0.09) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '0', left: '-10%',
        width: '40vw', height: '50vh',
        background: 'radial-gradient(ellipse 50% 50% at 30% 70%, rgba(207,69,0,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Orbital arc SVG */}
      <svg aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }} viewBox="0 0 1400 700" preserveAspectRatio="none">
        <path d="M -80 520 Q 360 120 820 480 Q 1060 680 1500 280" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.35" />
        <path d="M 60 650 Q 380 280 940 560" stroke="#F37338" strokeWidth="1" fill="none" opacity="0.18" />
        <circle cx="820" cy="480" r="5" fill="#F37338" opacity="0.5" />
        <circle cx="360" cy="120" r="3" fill="#F37338" opacity="0.3" />
        <circle cx="940" cy="560" r="2.5" fill="#F37338" opacity="0.25" />
      </svg>

      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>

        {/* Ghost watermark */}
        <div className="watermark" style={{
          position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', fontSize: 'clamp(56px, 11vw, 130px)', opacity: 0.45,
          userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em',
        }}>
          Broadcast
        </div>

        {/* Main content */}
        <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto 48px', position: 'relative' }}>

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.1)',
              borderRadius: 'var(--r-pill)', padding: '7px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
                animation: 'hero-pulse 2s ease-in-out infinite',
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                2,400+ creators broadcasting live
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <h1 style={{ fontSize: 'clamp(40px, 8.5vw, 92px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.045em', lineHeight: 0.92, margin: '0 0 24px' }}>
              One post.<br />
              <span style={{ color: 'var(--arc)', position: 'relative', display: 'inline-block' }}>
                Every platform.
                {/* Underline accent */}
                <svg style={{ position: 'absolute', bottom: '-6px', left: 0, width: '100%', height: 6, overflow: 'visible' }} viewBox="0 0 300 6" preserveAspectRatio="none">
                  <path d="M 0 5 Q 75 0 150 4 Q 225 8 300 3" stroke="#F37338" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
                </svg>
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 'clamp(15px, 2.2vw, 19px)', fontWeight: 450, color: 'var(--slate)', lineHeight: 1.55, margin: '0 0 36px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
          >
            GAP Social‑pilot broadcasts your content to Instagram, YouTube, LinkedIn + 8 more — simultaneously, with zero friction.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}
          >
            <button
              onClick={() => navigate('/login')}
              className="btn-ink"
              style={{ fontSize: 15, padding: '14px 28px', borderRadius: 'var(--r-btn)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Start broadcasting free
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <a href="#how-it-works" className="btn-outline" style={{ fontSize: 15, padding: '13px 28px', borderRadius: 'var(--r-btn)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              See how it works
            </a>
          </motion.div>

          {/* Trust note */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}
            style={{ fontSize: 12, fontWeight: 500, color: 'var(--dust)', letterSpacing: '0.01em' }}
          >
            Free forever plan · No credit card required
          </motion.p>
        </div>

        {/* Platform strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 64 }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Broadcasts to
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)',
            borderRadius: 'var(--r-pill)', padding: '7px 14px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          }}>
            {PLATFORMS.map((p, i) => (
              <div key={p.label} title={p.label} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--white)', border: '1.5px solid var(--canvas)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: i === 0 ? 0 : -8, zIndex: PLATFORMS.length - i, position: 'relative',
                transition: 'transform 0.2s, z-index 0s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.15)'; e.currentTarget.style.zIndex = 20; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = PLATFORMS.length - i; }}
              >
                <img src={p.src} alt={p.label} style={{ width: 18, height: 18, objectFit: 'contain' }} />
              </div>
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', marginLeft: 10, whiteSpace: 'nowrap' }}>
              + more
            </span>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, maxWidth: 860, margin: '0 auto' }}
        >
          {STATS.map(({ value, label, sub }) => (
            <div key={label}
              style={{
                background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)',
                borderRadius: 'var(--r-hero)', padding: '24px 20px',
                textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6 }}>{label}</div>
              <div style={{ fontSize: 11, fontWeight: 450, color: 'var(--slate)', marginTop: 3, lineHeight: 1.3 }}>{sub}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes hero-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
      `}</style>
    </section>
  );
}
