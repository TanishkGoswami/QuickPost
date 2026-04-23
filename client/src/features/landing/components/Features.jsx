import React, { useLayoutEffect, useRef } from 'react';
import { Share2, Clock, BarChart2, Zap } from 'lucide-react';
import { gsap } from '../../../lib/gsap';

const FEATURES = [
  {
    icon: <Share2 size={24} />,
    title: 'One-click broadcast',
    desc: 'Write once, post everywhere. We handle the API calls, format conversions, and rate limits — you stay creative.',
  },
  {
    icon: <Clock size={24} />,
    title: 'Smart scheduling',
    desc: 'Schedule posts across timezones. Our production-grade scheduler fires exactly when you need it, every time.',
  },
  {
    icon: <BarChart2 size={24} />,
    title: 'Unified analytics',
    desc: 'All your engagement metrics — likes, views, shares — in one editorial dashboard. Stop switching tabs.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Lightning broadcast',
    desc: 'Posts go live simultaneously across all platforms in seconds. Background upload manager tracks every job in real-time.',
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
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 450, color: 'var(--slate)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
            Every feature is designed around one principle — your time is your most valuable asset.
          </p>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(16px, 3vw, 20px)', marginBottom: 'clamp(40px, 8vw, 72px)' }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              ref={el => { cardsRef.current[i] = el; }}
              className="feature-item"
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--ink)', color: 'var(--canvas)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
