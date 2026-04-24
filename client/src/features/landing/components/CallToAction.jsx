import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const PERKS = [
  'Free forever plan',
  'No credit card required',
  'Setup in 2 minutes',
];

export default function CallToAction() {
  const navigate = useNavigate();

  return (
    <section className="landing-section" style={{ padding: 'clamp(40px, 7vh, 72px) 24px', background: 'var(--canvas-lifted)' }}>
      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          style={{
            background: 'var(--ink)',
            borderRadius: 'clamp(24px, 4vw, 44px)',
            padding: 'clamp(52px, 10vw, 88px) clamp(28px, 6vw, 88px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Multi-layer orbital arcs */}
          <svg aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1000 400" preserveAspectRatio="none">
            <path d="M -50 320 Q 250 60 600 280 Q 800 400 1100 150" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M -100 380 Q 200 100 550 320 Q 750 420 1150 180" stroke="#F37338" strokeWidth="0.8" fill="none" opacity="0.18" />
            <circle cx="600" cy="280" r="5" fill="#F37338" opacity="0.65" />
            <circle cx="250" cy="60" r="3" fill="#F37338" opacity="0.35" />
            <circle cx="820" cy="330" r="2" fill="#F37338" opacity="0.25" />
          </svg>

          {/* Corner glow */}
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: '40%', height: '80%',
            background: 'radial-gradient(ellipse at 70% 30%, rgba(243,115,56,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

          {/* Ghost watermark */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(56px, 14vw, 160px)', fontWeight: 700, letterSpacing: '-0.04em',
            color: 'rgba(243,240,238,0.03)',
            whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', lineHeight: 1,
          }}>
            Go Live
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Eyebrow */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--arc)', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--arc)', display: 'inline-block', boxShadow: '0 0 0 4px rgba(243,115,56,0.2)', animation: 'hero-pulse 2s ease-in-out infinite' }} />
              Free forever plan available
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 700,
              color: 'var(--canvas)', letterSpacing: '-0.045em', lineHeight: 0.95,
              margin: '0 0 22px',
            }}>
              Ready to broadcast<br />
              <span style={{ color: 'var(--arc)' }}>everywhere?</span>
            </h2>

            <p style={{
              fontSize: 'clamp(15px, 2.2vw, 18px)', fontWeight: 450,
              color: 'rgba(243,240,238,0.6)',
              maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.55,
            }}>
              Join creators who've stopped wasting time on manual cross-posting and started focusing on what matters — great content.
            </p>

            {/* CTA button */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--canvas)', color: 'var(--ink)',
                  border: 'none', borderRadius: 'var(--r-btn)',
                  padding: '14px 34px', fontFamily: 'var(--font)',
                  fontSize: 16, fontWeight: 700, letterSpacing: '-0.025em',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Get started free
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Perks row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {PERKS.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="var(--arc)" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(243,240,238,0.55)', letterSpacing: '-0.01em' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
