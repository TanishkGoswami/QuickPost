import React, { useLayoutEffect, useRef } from 'react';
import { Share2, Clock, BarChart2, Zap } from 'lucide-react';
import { gsap } from '../../../lib/gsap';

const FEATURES = [
  {
    icon: <Share2 size={22} />,
    title: 'One-click broadcast',
    desc: 'Write once, post everywhere. We handle the API calls, format conversions, and rate limits — you stay creative.',
    accent: 'rgba(243,115,56,0.08)',
    accentBorder: 'rgba(243,115,56,0.2)',
    iconBg: 'var(--ink)',
    tag: 'Core',
  },
  {
    icon: <Clock size={22} />,
    title: 'Smart scheduling',
    desc: 'Schedule posts across timezones. Our production-grade scheduler fires exactly when you need it, every time.',
    accent: 'rgba(56,96,190,0.06)',
    accentBorder: 'rgba(56,96,190,0.15)',
    iconBg: 'var(--ink)',
    tag: 'Scheduling',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Unified analytics',
    desc: 'All your engagement metrics — likes, views, shares — in one editorial dashboard. Stop switching tabs.',
    accent: 'rgba(34,197,94,0.06)',
    accentBorder: 'rgba(34,197,94,0.15)',
    iconBg: 'var(--ink)',
    tag: 'Analytics',
  },
  {
    icon: <Zap size={22} />,
    title: 'Lightning broadcast',
    desc: 'Posts go live simultaneously across all platforms in seconds. Background upload manager tracks every job.',
    accent: 'rgba(234,179,8,0.07)',
    accentBorder: 'rgba(234,179,8,0.18)',
    iconBg: 'var(--ink)',
    tag: 'Speed',
  },
];

export default function Features() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      gsap.from(cardsRef.current.filter(Boolean), {
        opacity: 0,
        y: 40,
        stagger: { amount: 0.45 },
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="landing-section"
      style={{ padding: 'clamp(60px, 10vh, 100px) 24px', background: 'var(--canvas)' }}
    >
      <div className="landing-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 56px)' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '16px' }}>Features</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.1 }}>
            Built for serious creators
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 450, color: 'var(--slate)', maxWidth: 460, margin: '0 auto', lineHeight: 1.55 }}>
            Every feature is designed around one principle — your time is your most valuable asset.
          </p>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(14px, 2.5vw, 20px)' }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              ref={(el) => (cardsRef.current[i] = el)}
              className="feature-item"
              style={{
                background: 'var(--canvas-lifted)',
                border: `1px solid rgba(20,20,19,0.07)`,
                borderRadius: 'var(--r-hero)',
                padding: 'clamp(24px, 3vw, 32px)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
              }}
            >
              {/* Accent corner glow */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 120, height: 120,
                background: `radial-gradient(circle at 100% 0%, ${f.accent} 0%, transparent 70%)`,
                pointerEvents: 'none', borderRadius: 'var(--r-hero)',
              }} />

              {/* Tag */}
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: f.accent, border: `1px solid ${f.accentBorder}`,
                borderRadius: 'var(--r-pill)', padding: '3px 10px',
                fontSize: 10, fontWeight: 700, color: 'var(--slate)',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                marginBottom: 20, position: 'relative',
              }}>
                {f.tag}
              </div>

              {/* Icon */}
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: 'var(--ink)', color: 'var(--canvas)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18, position: 'relative',
                boxShadow: '0 4px 16px rgba(20,20,19,0.15)',
              }}>
                {f.icon}
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.025em', margin: '0 0 10px', lineHeight: 1.2 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.65, margin: 0, position: 'relative' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
