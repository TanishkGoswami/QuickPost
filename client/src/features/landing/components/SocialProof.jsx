import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';
import MacOSDock from '../../../components/ui/MacOSDock';

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
  { value: '200+', label: 'Active creators' },
  { value: '11+', label: 'Platforms supported' },
  { value: '99.9%', label: 'Scheduler uptime' },
  { value: '< 2 min', label: 'Setup time' },
];

const DOCK_APPS = [
  { id: 'ig', name: 'Instagram', icon: '/icons/ig-instagram-icon.svg' },
  { id: 'yt', name: 'YouTube', icon: '/icons/youtube-color-icon.svg' },
  { id: 'x', name: 'X', icon: '/icons/x-social-media-round-icon.svg' },
  { id: 'li', name: 'LinkedIn', icon: '/icons/linkedin-icon.svg' },
  { id: 'fb', name: 'Facebook', icon: '/icons/facebook-round-color-icon.svg' },
  { id: 'snap', name: 'Snapchat', icon: '/icons/snapchat-square-color-icon.svg' },
  { id: 'google', name: 'Google', icon: '/icons/google-icon.svg' },
  { id: 'reddit', name: 'Reddit', icon: '/icons/reddit-icon.svg' },
  { id: 'pin', name: 'Pinterest', icon: '/icons/pinterest-round-color-icon.svg' },
  { id: 'th', name: 'Threads', icon: '/icons/threads-icon.svg' },
  { id: 'bs', name: 'Bluesky', icon: '/icons/bluesky-circle-color-icon.svg' },
  { id: 'mas', name: 'Mastodon', icon: '/icons/mastodon-round-icon.svg' },
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
      <div className="landing-container" style={{ maxWidth: 1400, margin: '0 auto' }}>

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
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arc/10 text-arc text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            <span>Success Stories</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink mb-4 leading-tight">
            Real results, <span className="text-arc">real people</span>
          </h2>
          <p className="text-slate text-base md:text-lg max-w-2xl mx-auto font-medium">
            Join the elite circle of creators who have unlocked the power of multi-platform broadcasting.
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group p-8 rounded-[32px] bg-white border border-ink/5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
              style={{
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Background gradient hint */}
              <div 
                className="absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                style={{ background: t.color }}
              />

              {/* Top Accent */}
              <div 
                className="absolute top-0 left-8 right-8 h-[2px] opacity-30 group-hover:opacity-100 transition-opacity duration-500"
                style={{ 
                  background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` 
                }} 
              />

              <div className="relative z-10">
                <StarRow />

                {/* Styled Quote */}
                <div className="mb-6">
                  <span 
                    className="text-6xl font-serif text-arc/20 absolute -top-4 -left-2 pointer-events-none"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    &ldquo;
                  </span>
                  <p className="text-lg font-medium text-ink/90 leading-relaxed italic relative z-10">
                    {t.quote}
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-ink/5">
                  <div className="relative">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-500"
                      style={{ 
                        background: t.color,
                        boxShadow: `0 8px 16px ${t.color}30`
                      }}
                    >
                      {t.initials}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-ink text-sm tracking-tight">{t.name}</h4>
                    <p className="text-xs text-slate font-semibold">
                      {t.title} <span className="text-arc/80 mx-1">·</span> <span className="text-arc font-bold">{t.sub}</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform Dock */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          style={{ textAlign: 'center', marginTop: 40 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 32 }}>Broadcasts to</div>

          <div style={{ padding: '20px 0', overflow: 'visible' }}>
            <MacOSDock
              apps={DOCK_APPS}
              openApps={['ig', 'yt', 'li', 'x']}
              onAppClick={(id) => console.log('Dock click:', id)}
            />
          </div>

        </motion.div>
      </div>
    </section>
  );
}
