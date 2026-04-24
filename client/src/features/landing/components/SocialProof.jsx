import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "I used to spend 45 minutes posting to each platform individually. Now it's one click and I'm done.",
    name: 'Sarah K.',
    title: 'Content Creator',
    sub: '180K followers',
    initials: 'SK',
    color: '#f37338',
  },
  {
    quote: "The scheduling is rock-solid. Posts go out at exactly the right time even across different timezones.",
    name: 'Marcus T.',
    title: 'Digital Marketing Lead',
    sub: 'Agency',
    initials: 'MT',
    color: '#3860be',
  },
  {
    quote: "Finally a tool that handles YouTube, Instagram, and LinkedIn without me babysitting it.",
    name: 'Priya M.',
    title: 'Founder & Solopreneur',
    sub: 'B2B SaaS',
    initials: 'PM',
    color: '#22c55e',
  },
];

const METRICS = [
  { value: '2,400+', label: 'Active creators' },
  { value: '11+', label: 'Platforms supported' },
  { value: '99.9%', label: 'Scheduler uptime' },
  { value: '< 2 min', label: 'Setup time' },
];

const PLATFORMS = [
  '/icons/ig-instagram-icon.svg',
  '/icons/youtube-color-icon.svg',
  '/icons/x-social-media-round-icon.svg',
  '/icons/linkedin-icon.svg',
  '/icons/tiktok-circle-icon.svg',
  '/icons/facebook-round-color-icon.svg',
  '/icons/pinterest-round-color-icon.svg',
  '/icons/threads-icon.svg',
  '/icons/bluesky-circle-color-icon.svg',
  '/icons/mastodon-round-icon.svg',
];

function StarRow() {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} fill="#f37338" color="#f37338" />
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="landing-section" style={{ padding: 'clamp(64px, 10vh, 104px) 24px', background: 'var(--canvas)' }}>
      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Metrics banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 1, background: 'rgba(20,20,19,0.08)',
            borderRadius: 'var(--r-hero)', overflow: 'hidden',
            marginBottom: 'clamp(48px, 7vw, 72px)',
            border: '1px solid rgba(20,20,19,0.08)',
          }}
        >
          {METRICS.map((m, i) => (
            <div key={m.label} style={{
              background: 'var(--canvas-lifted)', padding: '28px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 52px)' }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 14 }}>From creators</div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.035em', margin: 0, lineHeight: 1.1 }}>
            Real results, real people
          </h2>
        </motion.div>

        {/* Testimonial cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(14px, 2.5vw, 20px)', marginBottom: 'clamp(48px, 8vw, 80px)' }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: 'var(--canvas-lifted)',
                border: '1px solid rgba(20,20,19,0.07)',
                borderRadius: 'var(--r-hero)',
                padding: '28px',
                position: 'relative', overflow: 'hidden',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Accent top border */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${t.color}, transparent)`,
                borderRadius: 'var(--r-hero) var(--r-hero) 0 0',
              }} />

              {/* Stars */}
              <StarRow />

              {/* Big quote mark */}
              <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--arc)', lineHeight: 0.8, marginBottom: 10, fontFamily: 'Georgia, serif', opacity: 0.7 }}>"</div>

              <p style={{ fontSize: 15, fontWeight: 450, color: 'var(--ink)', lineHeight: 1.65, margin: '0 0 24px', fontStyle: 'italic' }}>
                {t.quote}
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(20,20,19,0.07)' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                  boxShadow: `0 4px 14px ${t.color}40`,
                }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 2 }}>
                    {t.title} · <span style={{ color: 'var(--arc)', fontWeight: 600 }}>{t.sub}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform logos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 24 }}>Broadcasts to</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {PLATFORMS.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="platform-logo"
                style={{ width: 58, height: 58, transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.08)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <img src={src} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
