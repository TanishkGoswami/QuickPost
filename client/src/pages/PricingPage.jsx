import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Sparkles, ChevronDown } from 'lucide-react';
import LandingNav from '../features/landing/components/LandingNav';
import '../styles/landing.css';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const PLANS = [
  {
    name: 'Free',
    id: 'free',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for getting started with basic scheduling.',
    icon: <Zap size={20} />,
    features: [
      '3 connected social accounts',
      '10 posts per month',
      'Basic scheduling',
      '7-day post history',
    ],
    cta: 'Get started free',
    ctaAction: 'login',
    highlighted: false,
  },
  {
    name: 'Pro',
    id: '999',
    price: { monthly: 999, annual: 799 },
    description: 'For creators who broadcast seriously across every platform.',
    icon: <Sparkles size={20} />,
    features: [
      '10 connected social accounts',
      'Unlimited posts',
      'Smart scheduling & timezone sync',
      'Analytics dashboard',
      '90-day post history',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    ctaAction: 'login',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    id: '2999',
    price: { monthly: 2999, annual: 2399 },
    description: 'For teams and agencies managing multiple brands at scale.',
    icon: <Building2 size={20} />,
    features: [
      'Unlimited connected accounts',
      'Unlimited posts',
      'Advanced analytics & exports',
      'Team collaboration (5 seats)',
      'Custom integrations',
      'Dedicated account support',
      'Full post history',
    ],
    cta: 'Start Enterprise',
    ctaAction: 'login',
    highlighted: false,
  },
];

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
          width: '100%', textAlign: 'left', padding: '20px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          fontFamily: 'var(--font)',
        }}
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
  const { user, isAuthenticated } = useAuth();
  const [billing, setBilling] = useState('monthly');
  const [upgrading, setUpgrading] = useState(null);

  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleUpgrade = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (plan.id === 'free') {
      navigate('/dashboard');
      return;
    }

    try {
      setUpgrading(plan.id);
      
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          planId: plan.id,
          userId: user.userId,
          customerName: user.name,
          customerEmail: user.email,
        },
      });

      if (error) throw error;
      if (data.success && data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', fontFamily: 'var(--font)' }}>
      <LandingNav />


      {/* ── Hero ── */}
      <section style={{ padding: 'clamp(64px, 12vh, 120px) 24px clamp(40px, 6vh, 64px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle radial glow */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '60vh',
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(243,115,56,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative' }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Pricing</div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 600, color: 'var(--ink)',
            letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 18px',
          }}>
            Simple, honest pricing.
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 450, color: 'var(--slate)',
            maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.55,
          }}>
            Start free, scale when you're ready. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'var(--canvas-lifted)',
            border: '1px solid rgba(20,20,19,0.08)',
            borderRadius: 'var(--r-pill)',
            padding: 4, gap: 2,
          }}>
            {['monthly', 'annual'].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: '7px 20px', borderRadius: 'var(--r-pill)', border: 'none',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: billing === b ? 'var(--ink)' : 'transparent',
                  color: billing === b ? 'var(--canvas)' : 'var(--slate)',
                  letterSpacing: '-0.01em',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px',
                    borderRadius: 'var(--r-pill)',
                    background: billing === 'annual' ? 'rgba(243,115,56,0.2)' : 'rgba(243,115,56,0.12)',
                    color: 'var(--arc)',
                  }}>
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Pricing cards ── */}
      <section style={{ padding: '0 24px clamp(64px, 10vh, 100px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                borderRadius: 'var(--r-hero)',
                border: plan.highlighted ? 'none' : '1px solid rgba(20,20,19,0.08)',
                background: plan.highlighted ? 'var(--ink)' : 'var(--canvas-lifted)',
                padding: 'clamp(28px, 4vw, 36px)',
                position: 'relative',
                boxShadow: plan.highlighted ? '0 32px 64px -16px rgba(20,20,19,0.22)' : 'none',
                transform: plan.highlighted ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--arc)', color: 'var(--white)',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  padding: '5px 14px', borderRadius: '0 0 var(--r-chip) var(--r-chip)',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: plan.highlighted ? 'rgba(243,115,56,0.18)' : 'var(--ink)',
                color: plan.highlighted ? 'var(--arc)' : 'var(--canvas)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                {plan.icon}
              </div>

              {/* Plan name + description */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: plan.highlighted ? 'var(--canvas)' : 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 450, color: plan.highlighted ? 'rgba(243,240,238,0.6)' : 'var(--slate)', lineHeight: 1.5 }}>
                  {plan.description}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 'clamp(40px, 5vw, 52px)', fontWeight: 600, color: plan.highlighted ? 'var(--canvas)' : 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    ₹{plan.price[billing]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 450, color: plan.highlighted ? 'rgba(243,240,238,0.5)' : 'var(--slate)', marginBottom: 6 }}>
                    {plan.price[billing] === 0 ? 'forever' : `/ mo`}
                  </span>
                </div>
                {billing === 'annual' && plan.price.monthly > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--arc)', marginTop: 4 }}>
                    Billed ₹{plan.price.annual * 12}/year · Save ₹{(plan.price.monthly - plan.price.annual) * 12}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={upgrading === plan.id}
                style={{
                  width: '100%', padding: '13px 20px',
                  borderRadius: 'var(--r-btn)', border: plan.highlighted ? 'none' : '1px solid rgba(20,20,19,0.12)',
                  background: plan.highlighted ? 'var(--canvas)' : 'transparent',
                  color: plan.highlighted ? 'var(--ink)' : 'var(--ink)',
                  fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
                  letterSpacing: '-0.01em', cursor: 'pointer',
                  transition: 'all 0.2s', marginBottom: 28,
                  opacity: upgrading === plan.id ? 0.7 : 1,
                }}
                onMouseEnter={e => {
                  if (plan.highlighted) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  } else {
                    e.currentTarget.style.background = 'rgba(20,20,19,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!plan.highlighted) e.currentTarget.style.background = 'transparent';
                }}
              >
                {upgrading === plan.id ? 'Processing...' : plan.cta}
              </button>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${plan.highlighted ? 'rgba(243,240,238,0.1)' : 'rgba(20,20,19,0.07)'}`, marginBottom: 24 }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: plan.highlighted ? 'rgba(243,115,56,0.18)' : 'rgba(20,20,19,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}>
                      <Check size={11} color={plan.highlighted ? 'var(--arc)' : 'var(--ink)'} strokeWidth={2.5} />
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 450, color: plan.highlighted ? 'rgba(243,240,238,0.75)' : 'var(--slate)', lineHeight: 1.45 }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── All plans include ── */}
      <section style={{ padding: 'clamp(40px, 6vh, 64px) 24px', background: 'var(--canvas-lifted)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Every plan</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em', margin: '0 0 40px' }}>
              What's always included
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: '11+ platforms', sub: 'Instagram, YouTube, TikTok & more' },
              { label: 'Secure OAuth', sub: 'Read-only credentials, never stored' },
              { label: 'Background jobs', sub: 'Upload manager tracks every post' },
              { label: 'Timezone sync', sub: 'Schedule posts in any timezone' },
              { label: 'Live preview', sub: 'See how each post looks per platform' },
              { label: 'No watermarks', sub: 'Your content, your brand' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                style={{
                  background: 'var(--white)', borderRadius: 'var(--r-hero)',
                  border: '1px solid rgba(20,20,19,0.07)',
                  padding: '20px 16px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.45 }}>{item.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(64px, 10vh, 100px) 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>FAQ</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em', margin: 0 }}>
              Common questions
            </h2>
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
              <path d="M -50 290 Q 250 50 600 250 Q 800 360 1100 120" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.45" />
              <circle cx="600" cy="250" r="4.5" fill="#F37338" opacity="0.65" />
              <circle cx="250" cy="50" r="3" fill="#F37338" opacity="0.35" />
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
