import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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

export default function FAQ() {
  return (
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
  );
}
