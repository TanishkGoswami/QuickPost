import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Sparkles, AlertCircle } from 'lucide-react';
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
    cta: 'Current Plan',
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
    cta: 'Upgrade to Enterprise',
    highlighted: false,
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState('monthly');
  const [upgrading, setUpgrading] = useState(null);

  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleUpgrade = async (plan) => {
    if (plan.name === user?.plan || plan.id === 'free') {
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
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Billing & Plans
        </h1>
        <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan Banner */}
      <div style={{ 
        background: 'var(--canvas-lifted)', 
        border: '1px solid rgba(20,20,19,0.08)',
        borderRadius: 'var(--r-hero)',
        padding: '24px',
        marginBottom: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate)', marginBottom: 4 }}>
            Current Plan
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
            {user?.plan || 'Free'} Plan
          </div>
        </div>
        {user?.plan !== 'Free' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate)', background: 'var(--canvas)', padding: '8px 12px', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20,20,19,0.05)' }}>
            <AlertCircle size={14} />
            Subscription managed via Razorpay
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
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
      </div>

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
        {PLANS.map((plan, i) => {
          const isCurrentPlan = (user?.plan || 'Free') === plan.name;
          
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
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
              {plan.badge && !isCurrentPlan && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--arc)', color: 'var(--white)',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  padding: '5px 14px', borderRadius: '0 0 var(--r-chip) var(--r-chip)',
                }}>
                  {plan.badge}
                </div>
              )}
              {isCurrentPlan && (
                 <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--green)', color: 'var(--white)',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  padding: '5px 14px', borderRadius: '0 0 var(--r-chip) var(--r-chip)',
                }}>
                  Current Plan
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
                disabled={upgrading === plan.id || isCurrentPlan}
                style={{
                  width: '100%', padding: '13px 20px',
                  borderRadius: 'var(--r-btn)', border: plan.highlighted ? 'none' : '1px solid rgba(20,20,19,0.12)',
                  background: isCurrentPlan ? 'transparent' : (plan.highlighted ? 'var(--canvas)' : 'var(--ink)'),
                  color: isCurrentPlan ? (plan.highlighted ? 'var(--canvas)' : 'var(--slate)') : (plan.highlighted ? 'var(--ink)' : 'var(--canvas)'),
                  fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
                  letterSpacing: '-0.01em', cursor: isCurrentPlan ? 'default' : 'pointer',
                  transition: 'all 0.2s', marginBottom: 28,
                  opacity: upgrading === plan.id || isCurrentPlan ? 0.7 : 1,
                }}
              >
                {upgrading === plan.id ? 'Processing...' : (isCurrentPlan ? 'Current Plan' : plan.cta)}
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
          )
        })}
      </div>
    </div>
  );
}
