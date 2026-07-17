import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Building2, Globe, Shield, Zap, Check } from 'lucide-react';
import LandingNav from '../features/landing/components/LandingNav';
import Pricing from '../features/landing/components/Pricing';
import { useAuth } from '../context/AuthContext';
import '../styles/landing.css';

const FAQS = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we prorate any billing differences.',
  },
  {
    q: 'What counts as a "connected account"?',
    a: 'Each social profile you link — an Instagram account, a YouTube channel, a LinkedIn page — counts as one connected account.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes, we offer a 3-day full access trial for Pro and Enterprise plans. No credit card required to start.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'Instagram, YouTube, LinkedIn, TikTok, X (Twitter), Facebook, Pinterest, Threads, Bluesky, Mastodon, and more — 11+ platforms and growing.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If you are not satisfied within your first 3 days of a paid plan, contact us for a full refund — no questions asked.',
  },
];

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      style={{
        borderBottom: '1px solid rgba(20,20,19,0.08)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', padding: '24px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          fontFamily: 'var(--font)',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
        onMouseLeave={e => e.currentTarget.style.opacity = 1}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: 'var(--slate)' }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ overflow: 'hidden' }}
      >
        <p style={{ fontSize: 15, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.6, paddingBottom: 20, margin: 0 }}>{a}</p>
      </motion.div>
    </motion.div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  React.useEffect(() => { window.scrollTo(0, 0); }, []);
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', fontFamily: 'var(--font)' }}>
      <LandingNav />

      {/* ── Pricing Hero ── */}
      <section style={{ paddingTop: 'clamp(80px, 15vh, 120px)', paddingBottom: '40px', paddingHorizontal: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 72px)',
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              margin: '0 0 24px'
            }}>
              Simple, honest pricing.
            </h1>
            <p style={{
              fontSize: 'clamp(18px, 2.5vw, 22px)',
              fontWeight: 450,
              color: 'var(--slate)',
              lineHeight: 1.5,
              maxWidth: 580,
              margin: '0 auto 48px',
            }}>
              Start free, scale when you're ready. No hidden fees, no surprises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Trusted By ── */}
      <section style={{ paddingBottom: '64px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-light)' }}>
            Trusted by 10,000+ creators
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(24px, 5vw, 48px)', opacity: 0.6, flexWrap: 'wrap' }}>
            {/* Minimalist fake logos */}
            {['Acme Corp', 'GlobalScale', 'Nexus', 'Vertex', 'Lumina'].map(name => (
              <span key={name} style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--slate)' }}>
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The beautiful polished pricing component */}
      <div style={{ paddingBottom: 20 }}>
        <Pricing hideHeader />
      </div>

      {/* ── Feature Comparison Table ── */}
      <section style={{ padding: 'clamp(40px, 8vh, 80px) 24px', background: 'var(--canvas)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em', margin: '0 0 16px' }}>
              Compare features
            </h2>
            <p style={{ fontSize: 16, color: 'var(--slate)', maxWidth: 500, margin: '0 auto' }}>
              Detailed breakdown of everything included in each tier.
            </p>
          </motion.div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.1)', fontSize: 13, fontWeight: 600, color: 'var(--slate)' }}>Features</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.1)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Free</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.1)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Starter</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.1)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Growth</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { section: 'Publishing' },
                  { feature: 'Connected Social Accounts', free: '3', slite: '10', sgrowth: 'Unlimited' },
                  { feature: 'Posts per month', free: '10 / channel', slite: 'Unlimited', sgrowth: 'Unlimited' },
                  { feature: 'Automated Publishing', free: true, slite: true, sgrowth: true },
                  { feature: 'Bulk Upload', free: false, slite: true, sgrowth: true },
                  { feature: 'Custom Timezones', free: false, slite: true, sgrowth: true },
                  { section: 'Analytics' },
                  { feature: 'Basic Reporting', free: true, slite: true, sgrowth: true },
                  { feature: 'Engagement Metrics', free: false, slite: true, sgrowth: true },
                  { feature: 'Custom Export (CSV/PDF)', free: false, slite: false, sgrowth: true },
                  { section: 'Team & Support' },
                  { feature: 'Team Members', free: '1', slite: 'Up to 5', sgrowth: 'Unlimited' },
                  { feature: 'Approval Workflows', free: false, slite: false, sgrowth: true },
                  { feature: 'Support Level', free: 'Community', slite: 'Priority Email', sgrowth: '24/7 Dedicated' },
                ].map((row, i) => (
                  row.section ? (
                    <tr key={`sec-${i}`}>
                      <td colSpan={4} style={{ padding: '32px 24px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate)', borderBottom: '1px solid rgba(20,20,19,0.05)' }}>
                        {row.section}
                      </td>
                    </tr>
                  ) : (
                    <tr key={`row-${i}`}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.05)', fontSize: 14, color: 'var(--ink)' }}>{row.feature}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.05)', fontSize: 14, color: 'var(--slate)' }}>
                        {row.free === true ? <Check size={18} color="var(--ink)" /> : row.free === false ? <span style={{ color: 'rgba(20,20,19,0.2)' }}>—</span> : row.free}
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.05)', fontSize: 14, color: 'var(--slate)' }}>
                        {row.slite === true ? <Check size={18} color="var(--ink)" /> : row.slite === false ? <span style={{ color: 'rgba(20,20,19,0.2)' }}>—</span> : row.slite}
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid rgba(20,20,19,0.05)', fontSize: 14, color: 'var(--slate)' }}>
                        {row.sgrowth === true ? <Check size={18} color="var(--ink)" /> : row.sgrowth === false ? <span style={{ color: 'rgba(20,20,19,0.2)' }}>—</span> : row.sgrowth}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── All plans include ── */}
      <section style={{ padding: 'clamp(40px, 6vh, 64px) 24px', background: 'var(--canvas-lifted)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Every plan</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em', margin: 0 }}>
              What's always included
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { icon: <Globe size={20} />, label: '11+ platforms', sub: 'Instagram, YouTube, TikTok & more' },
              { icon: <Shield size={20} />, label: 'Secure OAuth', sub: 'Read-only credentials, never stored' },
              { icon: <Zap size={20} />, label: 'Background jobs', sub: 'Upload manager tracks every post' },
              { icon: <Globe size={20} />, label: 'Timezone sync', sub: 'Schedule posts in any timezone' },
              { icon: <Check size={20} />, label: 'Live preview', sub: 'See how each post looks per platform' },
              { icon: <Shield size={20} />, label: 'No watermarks', sub: 'Your content, your brand' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                style={{
                  background: 'var(--white)', borderRadius: '12px',
                  border: '1px solid rgba(20,20,19,0.06)',
                  padding: '24px', display: 'flex', flexDirection: 'column', gap: 12,
                  boxShadow: '0 1px 2px rgba(20,20,19,0.02)'
                }}
              >
                <div style={{ color: 'var(--ink)', opacity: 0.8 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.45 }}>{item.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(64px, 10vh, 120px) 24px', background: 'var(--canvas)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(48px, 8vw, 80px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1 }}>
              Got questions?<br />We have answers.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--slate)', lineHeight: 1.5, marginBottom: 32 }}>
              Everything you need to know about billing, plans, and getting started.
            </p>
          </motion.div>
          <div>
            {FAQS.map((faq, i) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(40px, 6vh, 64px) 24px clamp(64px, 10vh, 100px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'var(--ink)', borderRadius: 'clamp(24px, 4vw, 40px)',
              padding: 'clamp(48px, 8vw, 72px) clamp(24px, 5vw, 72px)',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Orbital arc */}
            <svg aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1000 360" preserveAspectRatio="none">
              <path d="M -50 290 Q 250 50 600 250 Q 800 360 1100 120" stroke="#FF5600" strokeWidth="1.5" fill="none" opacity="0.45" />
              <circle cx="600" cy="250" r="4.5" fill="#FF5600" opacity="0.65" />
              <circle cx="250" cy="50" r="3" fill="#FF5600" opacity="0.35" />
            </svg>

            {/* Ghost watermark */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: 'clamp(60px, 14vw, 150px)', fontWeight: 600, letterSpacing: '-0.03em',
              color: 'rgba(243,240,238,0.03)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', lineHeight: 1,
            }}>
              Broadcast
            </div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--arc)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>•</span>
                Free forever plan available
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 600, color: 'var(--canvas)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 18px' }}>
                Start broadcasting today.
              </h2>
              <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', fontWeight: 450, color: 'rgba(243,240,238,0.6)', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.55 }}>
                No credit card required. Set up in under 2 minutes.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--canvas)', color: 'var(--ink)',
                  border: 'none', borderRadius: 'var(--r-btn)',
                  padding: '13px 32px', fontFamily: 'var(--font)',
                  fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get started free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--canvas)', borderTop: '1px solid rgba(20,20,19,0.08)', padding: '32px 32px' }}>
        <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 450, color: 'var(--slate)' }}>
              © 2025 GAP Social-pilot. All rights reserved.
            </div>

            {isAuthenticated && user && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 12px', 
                background: 'rgba(20,20,19,0.03)', 
                borderRadius: '10px',
                border: '1px solid rgba(20,20,19,0.05)'
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate)' }}>
                  Logged in as: <span style={{ color: 'var(--ink)' }}>{user.email}</span>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {[
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
              ].map(({ label, to }) => (
                <Link key={label} to={to} style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
