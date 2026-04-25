import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from '../../../lib/gsap';
import { motion } from 'framer-motion';
import { Link2, PenLine, SendHorizonal } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: <Link2 size={22} />,
    title: 'Connect your channels',
    desc: 'Link Instagram, YouTube, LinkedIn, TikTok and 7 more social accounts via secure OAuth. Takes under 2 minutes.',
    detail: ['Secure OAuth — no password stored', '11+ platforms supported', 'One-time setup'],
  },
  {
    num: '02',
    icon: <PenLine size={22} />,
    title: 'Create your post',
    desc: 'Write your caption, upload your media, pick your platforms. Our composer gives you a live preview per channel.',
    detail: ['Live per-platform preview', 'Image & video support', 'Caption per platform'],
  },
  {
    num: '03',
    icon: <SendHorizonal size={22} />,
    title: 'Broadcast or schedule',
    desc: 'Hit Send to go live immediately, or pick a time. Our scheduler handles timezone conversion automatically.',
    detail: ['Instant or scheduled broadcast', 'Automatic timezone sync', 'Background job tracking'],
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(44px, 6vw, 64px)' }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Process</div>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 54px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.035em', margin: '0 0 14px', lineHeight: 1.05 }}>
            Three steps to everywhere
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 450, color: 'var(--slate)', maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>
            From account setup to live post across all channels in minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(288px, 1fr))', gap: 'clamp(14px, 2.5vw, 24px)', position: 'relative' }}>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.13 }}
              style={{
                background: 'var(--canvas)',
                border: '1px solid rgba(20,20,19,0.08)',
                borderRadius: 'var(--r-hero)',
                padding: '32px 28px 28px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Step number watermark */}
              <div style={{
                position: 'absolute', top: 12, right: 20,
                fontSize: 80, fontWeight: 700, letterSpacing: '-0.05em',
                color: 'rgba(20,20,19,0.045)', lineHeight: 1,
                fontFamily: 'var(--font)', userSelect: 'none', pointerEvents: 'none',
              }}>
                {step.num}
              </div>

              {/* Icon + step pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'var(--ink)', color: 'var(--canvas)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 4px 14px rgba(20,20,19,0.14)',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(20,20,19,0.05)', borderRadius: 'var(--r-pill)',
                  padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, color: 'var(--slate)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  Step {i + 1}
                </div>
              </div>

              {/* Content */}
              <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.025em', margin: '0 0 10px', lineHeight: 1.25 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.65, margin: '0 0 20px' }}>
                {step.desc}
              </p>

              {/* Detail list */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {step.detail.map(d => (
                  <li key={d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--arc)', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--slate)' }}>{d}</span>
                  </li>
                ))}
              </ul>

              {/* Connector arrow (between cards) */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 44, right: -13,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 3, boxShadow: '0 2px 8px rgba(20,20,19,0.18)',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
