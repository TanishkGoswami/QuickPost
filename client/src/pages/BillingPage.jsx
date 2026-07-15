import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Sparkles, AlertCircle, Download, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import apiClient from '../utils/apiClient';

// QuickPost billing is independent from Hub product names.
function hasPaidPlan(plan) {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p !== 'free' && p !== '';
}

const PLANS_TEMPLATE = [
  {
    name: 'Free',
    id: 'free',
    price: { 1: 0, 3: 0, 6: 0, 12: 0 },
    description: 'Perfect for getting started with basic scheduling.',
    icon: <Zap size={20} />,
    features: [
      '3 connected social accounts',
      '10 scheduled posts per channel',
      '1 active trigger word',
      '50 automated replies / month',
      'QuickPost Branding Watermark',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Pro',
    id: 'pro',
    price: { 1: null, 3: null, 6: null, 12: null },
    description: 'For creators who broadcast seriously across every platform.',
    icon: <Sparkles size={20} />,
    features: [
      '10 connected social accounts',
      'Unlimited monthly posts',
      'Up to 10 Instagram Auto-DM accounts',
      'Unlimited trigger words & replies',
      'Hinglish & Hindi trigger matching',
      'Unlimited contacts',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: { 1: null, 3: null, 6: null, 12: null },
    description: 'For teams, agencies, and heavy automation users.',
    icon: <Building2 size={20} />,
    features: [
      '30 connected social accounts',
      'Up to 30 Instagram Auto-DM accounts',
      'Unlimited posts, replies & contacts',
      'Hinglish & Hindi trigger matching',
      'Approval workflows',
      '10 team members',
      'Developer API access',
    ],
    cta: 'Upgrade to Enterprise',
    highlighted: false,
  }
];

export default function BillingPage({ embedded = false }) {
  const { user } = useAuth();
  const [billing, setBilling] = useState(1);
  const [upgrading, setUpgrading] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoiceError, setInvoiceError] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentPlanName = user?.entitlements?.plan?.name || 'Free';
  const isPaid = hasPaidPlan(currentPlanName);

  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  React.useEffect(() => {
    let alive = true;
    apiClient.get('/api/billing/invoices')
      .then(({ data }) => {
        if (alive) setInvoices(data?.invoices || []);
      })
      .catch((err) => {
        if (!alive) return;
        if (err.response?.status === 404) {
          setInvoices([]);
          return;
        }
        setInvoiceError(err.response?.data?.message || err.message || 'Unable to load invoices');
      });
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    let alive = true;
    apiClient.get('/api/billing/plans')
      .then(({ data }) => {
        if (!alive) return;
        if (data.success && data.plans) {
          const merged = data.plans.map(dp => {
            const staticPlan = PLANS_TEMPLATE.find(sp => sp.id === dp.id);
            if (!staticPlan) return null;
            const priceMap = {
              1: dp.prices && dp.prices.hasOwnProperty('month') ? dp.prices.month : staticPlan.price?.[1],
              3: dp.prices && dp.prices.hasOwnProperty('quarterly') ? dp.prices.quarterly : staticPlan.price?.[3],
              6: dp.prices && dp.prices.hasOwnProperty('six_months') ? dp.prices.six_months : staticPlan.price?.[6],
              12: dp.prices && dp.prices.hasOwnProperty('year') ? dp.prices.year : staticPlan.price?.[12]
            };
            return {
              ...staticPlan,
              ...dp,
              features: staticPlan.features,
              price: priceMap
            };
          }).filter(Boolean);
          setPlans(merged);
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error('Failed to load pricing:', err);
        setError('Pricing temporarily unavailable');
        setPlans(PLANS_TEMPLATE.map(sp => ({
          ...sp,
          price: { 1: sp.id === 'free' ? 0 : null, 3: sp.id === 'free' ? 0 : null, 6: sp.id === 'free' ? 0 : null, 12: sp.id === 'free' ? 0 : null }
        })));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return `₹${Math.round(value / 100).toLocaleString('en-IN')}`;
  };

  const formatDate = (value) => {
    if (!value) return 'Not available';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  };

  const handleUpgrade = async (plan) => {
    if (currentPlanName === plan.name || plan.id === 'free') {
      return;
    }

    const currentPrice = plan.price?.[billing];
    if (currentPrice === null || currentPrice === undefined) {
      alert('This plan or billing interval is currently unavailable.');
      return;
    }

    try {
      setUpgrading(plan.id);
      console.log(`💳 [PAYMENT INITIATED] Plan: ${plan.name} | Interval: ${billing} month(s) | Amount to be charged: ₹${currentPrice * billing}`);
      
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          planId: plan.id,
          interval: billing,
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
    <div style={{ padding: embedded ? 0 : '32px', maxWidth: embedded ? 'none' : 1100, margin: '0 auto', fontFamily: 'var(--font)' }}>
      {/* Header */}
      {!embedded && <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Billing & Plans
        </h1>
        <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
          Manage your subscription and billing details.
        </p>
      </div>}

      {/* Current Plan Banner */}
      <div style={{ 
        background: 'var(--canvas-lifted)', 
        border: '1px solid rgba(20,20,19,0.08)',
        borderRadius: 'var(--r-hero)',
        padding: '24px',
        marginBottom: embedded ? 20 : 32,
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
            {currentPlanName} Plan
          </div>
        </div>
        {isPaid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate)', background: 'var(--canvas)', padding: '8px 12px', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20,20,19,0.05)' }}>
            <AlertCircle size={14} />
            Subscription managed via getaipilot.in
          </div>
        )}
      </div>

      <section style={{
        background: 'var(--canvas-lifted)',
        border: '1px solid var(--dust)',
        borderRadius: 'var(--r-hero)',
        padding: 24,
        marginBottom: embedded ? 24 : 36,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 6px' }}>Invoices</h2>
            <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>Paid QuickPost billing records and receipt downloads.</p>
          </div>
        </div>

        {invoiceError ? (
          <p style={{ margin: 0, color: 'var(--danger)', fontSize: 13 }}>{invoiceError}</p>
        ) : invoices.length === 0 ? (
          <div style={{ border: '1px dashed var(--dust)', borderRadius: 8, padding: 24, color: 'var(--slate)', fontSize: 14 }}>
            No invoices found yet. Paid invoices will appear here after Razorpay confirms payment.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {invoices.map((invoice) => (
              <div key={invoice.id || invoice.paymentId} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: 14,
                alignItems: 'center',
                border: '1px solid var(--dust)',
                borderRadius: 8,
                padding: 14,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 8, background: '#ebe7e1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', flexShrink: 0 }}>
                    <FileText size={17} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                      {invoice.plan} · {formatAmount(invoice.amount)}
                    </strong>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                      {formatDate(invoice.createdAt)} · {invoice.status}
                    </span>
                  </div>
                </div>
                {invoice.downloadUrl ? (
                  <a className="btn-ghost" href={invoice.downloadUrl} target="_blank" rel="noreferrer" download>
                    <Download size={14} /> Download
                  </a>
                ) : (
                  <button className="btn-ghost" disabled title="Invoice URL is not available for this payment yet">
                    <Download size={14} /> Download
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'var(--canvas-lifted)',
          border: '1px solid rgba(20,20,19,0.08)',
          borderRadius: 'var(--r-pill)',
          padding: 4, gap: 4, flexWrap: 'wrap', justifyContent: 'center'
        }}>
          {[
            { months: 1, discount: 0 },
            { months: 3, discount: 10 },
            { months: 6, discount: 15 },
            { months: 12, discount: 20 },
          ].map(({ months, discount }) => (
            <button
              key={months}
              onClick={() => setBilling(months)}
              style={{
                padding: '7px 20px', borderRadius: 'var(--r-pill)', border: 'none',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                background: billing === months ? 'var(--ink)' : 'transparent',
                color: billing === months ? 'var(--canvas)' : 'var(--slate)',
                letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {months} Month{months > 1 ? 's' : ''}
              {discount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px',
                  borderRadius: 'var(--r-pill)',
                  background: billing === months ? 'rgba(255,86,0,0.2)' : 'rgba(255,86,0,0.12)',
                  color: 'var(--arc)',
                }}>
                  -{discount}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing cards */}
      {error && (
        <div style={{
          textAlign: 'center', color: '#ff4444', background: 'rgba(255,68,68,0.1)',
          padding: '12px 24px', borderRadius: 8, marginBottom: 24,
          fontSize: 14, fontWeight: 600, maxWidth: 1100, margin: '0 auto 24px'
        }}>
          ⚠️ {error}. Paid checkouts are disabled.
        </div>
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
        {plans.map((plan, i) => {
          const isCurrentPlan = currentPlanName === plan.name;
          const currentPrice = plan.price?.[billing];
          const isCheckoutDisabled = plan.id !== 'free' && (currentPrice === null || currentPrice === undefined);
          
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                borderRadius: 'var(--r-hero)',
                border: `1px solid ${plan.highlighted ? 'rgba(255,86,0,0.35)' : 'rgba(20,20,19,0.08)'}`,
                background: plan.highlighted ? '#fff7f2' : 'var(--canvas-lifted)',
                padding: 'clamp(28px, 4vw, 36px)',
                position: 'relative',
                boxShadow: plan.highlighted ? '0 24px 48px rgba(255,86,0,0.12)' : 'none',
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
                background: plan.highlighted ? 'rgba(255,86,0,0.18)' : 'rgba(20,20,19,0.06)',
                color: plan.highlighted ? 'var(--arc)' : 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                {plan.icon}
              </div>

              {/* Plan name + description */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.5 }}>
                  {plan.description}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  {currentPrice !== null && currentPrice !== undefined ? (
                    <>
                      <span style={{ fontSize: 'clamp(40px, 5vw, 52px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        ₹{Math.round(currentPrice)}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 450, color: 'var(--slate)', marginBottom: 6 }}>
                        {currentPrice === 0 ? 'forever' : `/ mo`}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 600, color: '#ff4444', letterSpacing: '-0.02em', marginBottom: 6 }}>
                      Unavailable
                    </span>
                  )}
                </div>
                {billing > 1 && currentPrice !== null && currentPrice !== undefined && currentPrice > 0 && plan.price?.[1] > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--arc)', marginTop: 4 }}>
                    Billed ₹{Math.round(currentPrice * billing)} every {billing} months · Save ₹{Math.round((plan.price[1] - currentPrice) * billing)}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={upgrading === plan.id || isCurrentPlan || isCheckoutDisabled}
                style={{
                  width: '100%', padding: '13px 20px',
                  borderRadius: 'var(--r-btn)', border: plan.highlighted ? 'none' : '1px solid rgba(20,20,19,0.12)',
                  background: (isCurrentPlan || isCheckoutDisabled) ? 'transparent' : 'var(--ink)',
                  color: isCurrentPlan ? 'var(--green)' : (isCheckoutDisabled ? 'var(--slate)' : 'var(--canvas)'),
                  fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
                  letterSpacing: '-0.01em', cursor: (isCurrentPlan || isCheckoutDisabled) ? 'default' : 'pointer',
                  transition: 'all 0.2s', marginBottom: 28,
                  opacity: upgrading === plan.id || isCurrentPlan || isCheckoutDisabled ? 0.7 : 1,
                  border: isCheckoutDisabled ? '1px solid rgba(20,20,19,0.12)' : undefined,
                }}
              >
                {isCheckoutDisabled ? 'Unavailable' : (upgrading === plan.id ? 'Processing...' : (isCurrentPlan ? 'Current Plan' : plan.cta))}
              </button>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(20,20,19,0.07)', marginBottom: 24 }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: plan.highlighted ? 'rgba(255,86,0,0.18)' : 'rgba(20,20,19,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}>
                      <Check size={11} color={plan.highlighted ? 'var(--arc)' : 'var(--ink)'} strokeWidth={2.5} />
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.45 }}>
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
