import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CallToAction() {
  const navigate = useNavigate();

  return (
    <section className="landing-section" style={{ padding: 'clamp(40px, 8vh, 80px) 24px', background: 'var(--canvas-lifted)' }}>
      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'var(--ink)',
            borderRadius: 'clamp(24px, 4vw, 40px)',
            padding: 'clamp(48px, 10vw, 80px) clamp(24px, 5vw, 80px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Orbital arc on dark background */}
          <svg
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
          >
            <path d="M -50 320 Q 250 60 600 280 Q 800 400 1100 150" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.5" />
            <circle cx="600" cy="280" r="5" fill="#F37338" opacity="0.7" />
            <circle cx="250" cy="60" r="3" fill="#F37338" opacity="0.4" />
          </svg>

          {/* Ghost watermark */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(60px, 15vw, 160px)', fontWeight: 600, letterSpacing: '-0.03em',
            color: 'rgba(243,240,238,0.04)',
            whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
            lineHeight: 1,
          }}>
            Go Live
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--arc)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ color: 'var(--arc)', fontSize: 16 }}>•</span>
              Free forever plan available
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 600,
              color: 'var(--canvas)', letterSpacing: '-0.04em', lineHeight: 1,
              margin: '0 0 20px',
            }}>
              Ready to broadcast<br />everywhere?
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 450, color: 'rgba(243,240,238,0.65)',
              maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.5,
            }}>
              Join creators who've stopped wasting time on manual cross-posting and started focusing on what matters — great content.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--canvas)', color: 'var(--ink)',
                  border: 'none', borderRadius: 'var(--r-btn)',
                  padding: '12px 32px', fontFamily: 'var(--font)',
                  fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get started free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 4 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
