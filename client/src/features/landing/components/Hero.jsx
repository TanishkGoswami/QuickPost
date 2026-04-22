import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero-bg landing-section" style={{ padding: '100px 32px 80px', position: 'relative' }}>
      {/* Orbital arc SVG — the Mastercard signature connection motif */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}
        viewBox="0 0 1400 700"
        preserveAspectRatio="none"
      >
        <path d="M -80 520 Q 360 120 820 480 Q 1060 680 1500 280" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.45" />
        <path d="M 60 650 Q 380 280 940 560" stroke="#F37338" strokeWidth="1" fill="none" opacity="0.25" />
        <circle cx="820" cy="480" r="5" fill="#F37338" opacity="0.6" />
        <circle cx="360" cy="120" r="3" fill="#F37338" opacity="0.4" />
      </svg>

      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Ghost watermark */}
        <div className="watermark" style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', fontSize: 'clamp(56px, 8vw, 120px)', opacity: 0.55,
          userSelect: 'none', pointerEvents: 'none',
        }}>
          Broadcast
        </div>

        {/* Main headline */}
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 60px', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 20 }}>
              Social media, simplified
            </div>
            <h1 style={{ fontSize: 'clamp(48px, 7vw, 88px)', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 24px' }}>
              One post.<br />
              <span style={{ color: 'var(--arc)' }}>Every platform.</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 450, color: 'var(--slate)', lineHeight: 1.5, margin: '0 0 40px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
              GAP Social‑pilot broadcasts your content to Instagram, YouTube, LinkedIn + 8 more — simultaneously, with zero friction.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn-ink"
                style={{ fontSize: 16, padding: '13px 32px' }}
              >
                Start broadcasting free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <a
                href="#how-it-works"
                className="btn-outline"
                style={{ fontSize: 16, padding: '13px 28px' }}
              >
                See how it works
              </a>
            </div>
          </motion.div>
        </div>

        {/* Platform logos pill strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 6 }}>
            Broadcasts to
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)',
            borderRadius: 'var(--r-pill)', padding: '8px 12px',
            boxShadow: 'var(--shadow-nav)',
          }}>
            {PLATFORMS.map((p, i) => (
              <div
                key={p.label}
                title={p.label}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--white)', border: '2px solid var(--canvas)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: PLATFORMS.length - i,
                  position: 'relative',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <img src={p.src} alt={p.label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
              </div>
            ))}
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginLeft: 12, whiteSpace: 'nowrap' }}>
              + more
            </span>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.35 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 60 }}
        >
          {[
            { value: '11+', label: 'Platforms' },
            { value: '1-click', label: 'Broadcast' },
            { value: '∞', label: 'Scheduling' },
          ].map(({ value, label }, i) => (
            <div key={label}>
              <div style={{
                background: 'var(--canvas-lifted)',
                border: '1px solid rgba(20,20,19,0.08)',
                borderRadius: 'var(--r-hero)',
                padding: '20px 36px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-nav)',
              }}>
                <div style={{ fontSize: 36, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
