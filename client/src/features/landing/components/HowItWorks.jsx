import { motion } from 'framer-motion';

const STEPS = [
  {
    num: '01',
    title: 'Connect your channels',
    desc: 'Link Instagram, YouTube, LinkedIn, TikTok and 7 more social accounts via secure OAuth. Takes under 2 minutes.',
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
  return (
    <section id="how-it-works" className="landing-section" style={{ padding: 'clamp(60px, 10vh, 100px) 24px', background: 'var(--canvas-lifted)' }}>
      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 60px)' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Process</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.1 }}>
            Three steps to everywhere
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 450, color: 'var(--slate)', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
            From account setup to live post across all channels in minutes.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{
                background: 'var(--canvas)',
                border: '1px solid rgba(20,20,19,0.08)',
                borderRadius: 'var(--r-hero)',
                padding: '28px 28px 32px',
                position: 'relative',
              }}
            >
              {/* Step number — watermark style */}
              <div style={{
                fontSize: 72, fontWeight: 500, letterSpacing: '-0.04em',
                color: 'rgba(20,20,19,0.06)',
                lineHeight: 1, marginBottom: 8,
                fontFamily: 'var(--font)',
              }}>
                {step.num}
              </div>
              {/* Ink dot connector */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 44, right: -12,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </div>
              )}
              <h3 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
