import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../../lib/gsap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ArrowRight } from 'lucide-react';

const PLATFORMS = [
  { src: '/icons/ig-instagram-icon.svg', label: 'Instagram' },
  { src: '/icons/youtube-color-icon.svg', label: 'YouTube' },
  { src: '/icons/x-social-media-round-icon.svg', label: 'X' },
  { src: '/icons/linkedin-icon.svg', label: 'LinkedIn' },

  { src: '/icons/facebook-round-color-icon.svg', label: 'Facebook' },
  { src: '/icons/pinterest-round-color-icon.svg', label: 'Pinterest' },
  { src: '/icons/threads-icon.svg', label: 'Threads' },
  { src: '/icons/bluesky-circle-color-icon.svg', label: 'Bluesky' },
  { src: '/icons/mastodon-round-icon.svg', label: 'Mastodon' },
];

const STATS = [
  { value: '11+', label: 'Platforms', sub: 'All major networks' },
  { value: '1-click', label: 'Broadcast', sub: 'Write once, post everywhere' },
  { value: '∞', label: 'Scheduling', sub: 'No post limits' },
];

export default function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const watermarkRef = useRef(null);
  const eyebrowRef = useRef(null);
  const h1Ref = useRef(null);
  const paraRef = useRef(null);
  const buttonsRef = useRef(null);
  const logosRef = useRef(null);
  const statsRef = useRef(null);
  const counterRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Arc draw-on-scroll via stroke-dashoffset
      const arc1 = document.getElementById('arc-primary');
      const arc2 = document.getElementById('arc-secondary');
      if (arc1) {
        const len1 = arc1.getTotalLength();
        gsap.set(arc1, { strokeDasharray: len1, strokeDashoffset: len1 });
        gsap.to(arc1, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'center 30%',
            scrub: 1.5,
          },
        });
      }
      if (arc2) {
        const len2 = arc2.getTotalLength();
        gsap.set(arc2, { strokeDasharray: len2, strokeDashoffset: len2 });
        gsap.to(arc2, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            end: 'center 30%',
            scrub: 1.5,
          },
        });
      }

      // Watermark parallax
      gsap.to(watermarkRef.current, {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
        },
      });

      // Headline entrance — staggered timeline (fires on mount)
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(eyebrowRef.current, { opacity: 0, y: 12, duration: 0.4 })
        .from(h1Ref.current, { opacity: 0, y: 30, duration: 0.7 }, '-=0.2')
        .from(paraRef.current, { opacity: 0, y: 16, duration: 0.5 }, '-=0.4')
        .from(buttonsRef.current, { opacity: 0, y: 12, duration: 0.4 }, '-=0.3');

      // Platform logos stagger
      const logoEls = logosRef.current?.querySelectorAll('[data-logo]');
      if (logoEls?.length) {
        gsap.from(Array.from(logoEls), {
          opacity: 0,
          scale: 0.85,
          stagger: 0.04,
          duration: 0.35,
          ease: 'back.out(1.4)',
          delay: 0.55,
        });
      }

      // Stats row entrance
      const statCards = statsRef.current?.children;
      if (statCards?.length) {
        gsap.from(Array.from(statCards), {
          opacity: 0,
          y: 24,
          stagger: 0.12,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.65,
        });
      }

      // Count-up "11+"
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 10,
        duration: 1.8,
        ease: 'power2.out',
        delay: 0.8,
        onUpdate() {
          if (counterRef.current) counterRef.current.textContent = Math.round(obj.val) + '+';
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-bg landing-section"
      style={{ padding: 'clamp(60px, 15vh, 120px) 20px 80px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Orbital arc SVG */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}
        viewBox="0 0 1400 700"
        preserveAspectRatio="none"
      >
        <path id="arc-primary" className="orbital-arc" d="M -80 520 Q 360 120 820 480 Q 1060 680 1500 280" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.45" />
        <path id="arc-secondary" className="orbital-arc" d="M 60 650 Q 380 280 940 560" stroke="#F37338" strokeWidth="1" fill="none" opacity="0.25" />
        <circle cx="820" cy="480" r="5" fill="#F37338" opacity="0.6" />
        <circle cx="360" cy="120" r="3" fill="#F37338" opacity="0.4" />
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
              style={{ fontSize: 16, padding: '14px 28px' }}
            >
              Start broadcasting free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <a href="#how-it-works" className="btn-outline" style={{ fontSize: 16, padding: '14px 28px' }}>
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Platform logos pill strip */}
        <div
          ref={logosRef}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}
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
              <div
                key={p.label}
                data-logo=""
                title={p.label}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--white)', border: '1.5px solid var(--canvas)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: PLATFORMS.length - i,
                  position: 'relative',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <img src={p.src} alt={p.label} style={{ width: 18, height: 18, objectFit: 'contain' }} />
              </div>
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', marginLeft: 10, whiteSpace: 'nowrap' }}>
              + more
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div
          ref={statsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            maxWidth: 800,
            margin: '60px auto 0',
          }}
        >
          {[
            { value: '10+', label: 'Platforms', isCounter: true },
            { value: '1-click', label: 'Broadcast' },
            { value: '∞', label: 'Scheduling' },
          ].map(({ value, label, isCounter }) => (
            <div
              key={label}
              style={{
                background: 'var(--canvas-lifted)',
                border: '1px solid rgba(20,20,19,0.08)',
                borderRadius: 'var(--r-hero)',
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-nav)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div
                ref={isCounter ? counterRef : null}
                style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}
              >
                {value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
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
