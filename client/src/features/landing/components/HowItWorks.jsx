import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../../lib/gsap';

const STEPS = [
  {
    num: '01',
    title: 'Connect your channels',
    desc: 'Link Instagram, YouTube, LinkedIn and 7 more social accounts via secure OAuth. Takes under 2 minutes.',
  },
  {
    num: '02',
    title: 'Create your post',
    desc: 'Write your caption, upload your media, pick your platforms. Our composer gives you a live preview per channel.',
  },
  {
    num: '03',
    title: 'Broadcast or schedule',
    desc: 'Hit Send to go live immediately, or pick a time. Our scheduler handles timezone conversion automatically.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const stepsRef = useRef([]);
  const numsRef = useRef([]);
  const lineRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
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

      // Step cards stagger
      gsap.from(stepsRef.current.filter(Boolean), {
        opacity: 0,
        x: -20,
        stagger: 0.15,
        duration: 0.6,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      });

      // Watermark step numbers
      gsap.from(numsRef.current.filter(Boolean), {
        scale: 0.7,
        opacity: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      });

      // Connector line draw-on-scroll
      if (lineRef.current) {
        const len = lineRef.current.getTotalLength?.() ?? 600;
        gsap.set(lineRef.current, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(lineRef.current, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'bottom 60%',
            scrub: 1,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="landing-section"
      style={{ padding: 'clamp(60px, 10vh, 100px) 24px', background: 'var(--canvas-lifted)' }}
    >
      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 60px)' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Process</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.1 }}>
            Three steps to everywhere
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 450, color: 'var(--slate)', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
            From account setup to live post across all channels in minutes.
          </p>
        </div>

        {/* Steps grid with connector SVG overlay */}
        <div style={{ position: 'relative' }}>
          {/* Desktop connector line (hidden on mobile via landing.css) */}
          <svg
            className="step-connector-svg"
            aria-hidden="true"
            viewBox="0 0 900 2"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: '44px', left: '16.67%', width: '66.66%', height: 2, zIndex: 1, overflow: 'visible' }}
          >
            <line
              ref={lineRef}
              x1="0" y1="1" x2="900" y2="1"
              stroke="#F37338"
              strokeWidth="1.5"
              opacity="0.35"
            />
          </svg>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(16px, 3vw, 24px)', position: 'relative', zIndex: 2 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                ref={el => { stepsRef.current[i] = el; }}
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid rgba(20,20,19,0.08)',
                  borderRadius: 'var(--r-hero)',
                  padding: '28px 28px 32px',
                  position: 'relative',
                  transition: 'box-shadow 0.25s, transform 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Step number — watermark style */}
                <div
                  ref={el => { numsRef.current[i] = el; }}
                  style={{
                    fontSize: 72, fontWeight: 500, letterSpacing: '-0.04em',
                    color: 'rgba(20,20,19,0.06)',
                    lineHeight: 1, marginBottom: 8,
                    fontFamily: 'var(--font)',
                  }}
                >
                  {step.num}
                </div>
                {/* Step circle indicator */}
                <div className="step-circle" style={{ marginBottom: 16 }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
