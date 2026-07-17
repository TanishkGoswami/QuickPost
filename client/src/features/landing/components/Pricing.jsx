import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowUpRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000';

const PLANS_TEMPLATE = [
  {
    name: 'Free',
    id: 'free',
    price: { 1: 0, 3: 0, 6: 0, 12: 0 },
    description: 'Perfect for getting started with basic scheduling.',
    creditsText: 'Basic access to core tools',
    includedFeatures: [
      '3 connected social accounts',
      '10 scheduled posts per channel',
      '1 active trigger word',
      '50 automated replies / month',
      'QuickPost Branding Watermark',
    ],
    excludedFeatures: [
      'Unlimited monthly posts',
      'Instagram Auto-DM accounts',
      'Hinglish & Hindi trigger matching',
      'Approval workflows',
      'Team members',
    ],
    unlimitedFeatures: [],
    cta: 'Current Plan',
    cardBg: '#f6f5f3',
    btnBg: '#ffffff',
    btnBorder: '1px solid #d1d1d1',
    btnText: '#1a1a1a',
  },
  {
    name: 'Pro',
    id: 'pro',
    price: { 1: null, 3: null, 6: null, 12: null },
    description: 'For creators who broadcast seriously across every platform.',
    creditsText: 'Includes priority features + unlimited posts',
    badge: 'Most popular',
    includedFeatures: [
      '10 connected social accounts',
      'Unlimited monthly posts',
      'Up to 10 Instagram Auto-DM accounts',
      'Unlimited trigger words & replies',
      'Hinglish & Hindi trigger matching',
      'Unlimited contacts',
      'Priority email support',
    ],
    excludedFeatures: [
      'Approval workflows',
      '10 team members',
      'Developer API access',
    ],
    unlimitedFeatures: [
      { label: 'Monthly posts', badge: '∞ ALL YEAR' },
      { label: 'Trigger words & replies', badge: '∞ ALL YEAR' },
      { label: 'Contacts', badge: '∞ ALL YEAR' },
    ],
    cta: 'Upgrade to Pro',
    cardBg: '#ffffff',
    btnBg: '#1a1a1a',
    btnBorder: 'none',
    btnText: '#ffffff',
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: { 1: null, 3: null, 6: null, 12: null },
    description: 'For teams, agencies, and heavy automation users.',
    creditsText: 'Full access for scaling content production',
    badge: 'Expert choice',
    includedFeatures: [
      '30 connected social accounts',
      'Up to 30 Instagram Auto-DM accounts',
      'Unlimited posts, replies & contacts',
      'Hinglish & Hindi trigger matching',
      'Approval workflows',
      '10 team members',
      'Developer API access',
    ],
    excludedFeatures: [],
    unlimitedFeatures: [
      { label: 'Posts, replies & contacts', badge: '∞ ALL YEAR' },
      { label: 'Custom integrations', badge: '∞ ALL YEAR' },
      { label: 'Team members', badge: '∞ ALL YEAR' },
    ],
    cta: 'Get Enterprise',
    cardBg: '#ffffff',
    btnBg: '#1a1a1a',
    btnBorder: 'none',
    btnText: '#ffffff',
  }
];

export default function Pricing({ hideHeader = false }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [billing, setBilling] = useState(1);
  const [upgrading, setUpgrading] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`${API_URL}/api/billing/plans`);
        const data = await response.json();
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
              price: priceMap
            };
          }).filter(Boolean);
          setPlans(merged);
        } else {
          throw new Error('Failed to load plans');
        }
      } catch (err) {
        console.error('Failed to load pricing:', err);
        setError('Pricing temporarily unavailable');
        setPlans(PLANS_TEMPLATE.map(sp => ({
          ...sp,
          price: { 1: sp.id === 'free' ? 0 : null, 3: sp.id === 'free' ? 0 : null, 6: sp.id === 'free' ? 0 : null, 12: sp.id === 'free' ? 0 : null }
        })));
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleUpgrade = async (plan) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (plan.id === "free") {
      navigate("/dashboard");
      return;
    }

    const currentPrice = plan.price?.[billing];
    if (currentPrice === null || currentPrice === undefined) {
      alert('This plan or billing interval is currently unavailable.');
      return;
    }

    try {
      setUpgrading(plan.id);

      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          planId: plan.id,
          interval: billing,
          userId: user.userId,
          customerName: user.name,
          customerEmail: user.email,
        },}
      );

      if (error) throw error;
      if (data.success && data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        throw new Error(data.error || "Failed to create payment link");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const getBillingText = (months) => {
    if (months === 1) return 'billed monthly';
    if (months === 3) return 'billed quarterly';
    if (months === 6) return 'billed bi-annually';
    if (months === 12) return 'billed annually';
    return '';
  };

  return (
    <section
      id="pricing"
      className="landing-section"
      style={{ padding: "80px 24px", background: "#fdfdfa", fontFamily: "var(--font)" }}
    >
      <div
        className="landing-container"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          {!hideHeader && (
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 42px)",
                fontWeight: 600,
                color: "#3d0c0c",
                letterSpacing: "-0.03em",
                margin: "0 0 40px",
                lineHeight: 1.1,
              }}
            >
              Plans that cover your needs
            </h2>
          )}

          {/* Toggle Area */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 48,
            maxWidth: 1150,
            margin: "0 auto 48px",
            flexWrap: "wrap",
            gap: 20
          }}>
            {/* Left side: dummy Individual/Teams toggle */}
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              borderRadius: 9999,
              padding: 4,
              border: "1px solid #e5e5e5",
            }}>
              <div style={{
                background: "#1a1a1a",
                color: "#ffffff",
                borderRadius: 9999,
                padding: "8px 24px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "default",
              }}>
                Individual
              </div>
              <div style={{
                background: "transparent",
                color: "#1a1a1a",
                borderRadius: 9999,
                padding: "8px 24px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}>
                Teams
              </div>
            </div>

            {/* Right side: Billing toggle */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                background: "#ffffff",
                borderRadius: 9999,
                padding: 4,
                border: "1px solid #e5e5e5",
              }}>
                {[
                  { months: 1, label: 'Monthly' },
                  { months: 3, label: 'Quarterly' },
                  { months: 6, label: 'Half-Yearly' },
                  { months: 12, label: 'Annually' }
                ].map(({ months, label }) => (
                  <button
                    key={months}
                    onClick={() => setBilling(months)}
                    style={{
                      background: billing === months ? "#1a1a1a" : "transparent",
                      color: billing === months ? "#ffffff" : "#666",
                      border: "none",
                      borderRadius: 9999,
                      padding: "8px 20px",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "#666" }}>Save 20% with annual</span>
            </div>
          </div>
        </motion.div>

        {error && (
          <div style={{
            textAlign: 'center', color: '#ff4444', background: 'rgba(255,68,68,0.1)',
            padding: '12px 24px', borderRadius: 8, marginBottom: 24,
            fontSize: 14, fontWeight: 600, maxWidth: 1100, margin: '0 auto 24px'
          }}>
            ⚠️ {error}. Paid checkouts are disabled.
          </div>
        )}

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 20,
          alignItems: 'stretch',
          maxWidth: 1150,
          margin: '0 auto',
        }}>
          {plans.map((plan, i) => {
            const currentPrice = plan.price?.[billing];
            const basePrice = plan.price?.[1];
            const isCheckoutDisabled = plan.id !== 'free' && (currentPrice === null || currentPrice === undefined);
            const hasDiscount = billing > 1 && basePrice > currentPrice && currentPrice > 0;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  borderRadius: 12,
                  border: plan.name === 'Pro' ? '1px solid #3d0c0c' : plan.name === 'Enterprise' ? '1px solid #1a1a1a' : '1px solid #e5e5e5',
                  background: plan.name === 'Free' ? '#efebe5' : plan.name === 'Pro' ? '#ffffff' : '#f8f8f8',
                  padding: "32px 24px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 400, color: "#1a1a1a", margin: 0 }}>
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <div style={{
                      border: "1px solid #1a1a1a",
                      borderRadius: 16,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1a1a1a",
                      whiteSpace: "nowrap"
                    }}>
                      {plan.badge}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 13, color: "#4a4a4a", margin: "0 0 24px", minHeight: 40, lineHeight: 1.5 }}>
                  {plan.description}
                </p>

                {/* Pricing */}
                <div style={{ marginBottom: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
                  {currentPrice !== null && currentPrice !== undefined ? (
                    <>
                      {hasDiscount && (
                        <span style={{ fontSize: 24, color: "#b3b3b3", textDecoration: "line-through", fontWeight: 400 }}>
                          ₹{Math.round(basePrice)}
                        </span>
                      )}
                      <span style={{ fontSize: 44, fontWeight: 500, color: "#1a1a1a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                        ₹{Math.round(currentPrice)}
                      </span>
                      {currentPrice > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", marginLeft: 4 }}>
                          <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>/month</span>
                          <span style={{ fontSize: 11, color: "#1a1a1a" }}>{getBillingText(billing)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 500, color: '#ff4444' }}>
                      Unavailable
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#1a1a1a", marginBottom: 24, fontWeight: 400 }}>
                  {plan.creditsText}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgrading === plan.id || isCheckoutDisabled}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: plan.name === 'Free' ? '1px solid #1a1a1a' : 'none',
                    background: plan.name === 'Free' ? 'transparent' : plan.name === 'Pro' ? '#3d0c0c' : '#1a1a1a',
                    color: plan.name === 'Free' ? '#1a1a1a' : '#ffffff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: isCheckoutDisabled ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s",
                    marginBottom: 32,
                    opacity: upgrading === plan.id || isCheckoutDisabled ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isCheckoutDisabled) e.currentTarget.style.opacity = 0.9;
                  }}
                  onMouseLeave={(e) => {
                    if (!isCheckoutDisabled) e.currentTarget.style.opacity = 1;
                  }}
                >
                  {isCheckoutDisabled ? 'Unavailable' : (upgrading === plan.id ? "Processing..." : plan.cta)}
                </button>

                {/* Features list */}
                <div style={{ paddingBottom: 24, flex: 1 }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                    {plan.includedFeatures.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#1a1a1a" }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, flexShrink: 0, marginTop: 2 }}>
                          <Check size={14} strokeWidth={2} />
                        </span>
                        <span style={{ flex: 1, lineHeight: 1.4 }}>{f}</span>
                        <Info size={12} color="#b3b3b3" style={{ flexShrink: 0, marginTop: 3 }} />
                      </li>
                    ))}
                    {plan.excludedFeatures.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#a3a3a3" }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, flexShrink: 0, marginTop: 2 }}>
                          <X size={14} strokeWidth={2} />
                        </span>
                        <span style={{ flex: 1, lineHeight: 1.4 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Unlimited Box */}
                {plan.unlimitedFeatures && plan.unlimitedFeatures.length > 0 && (
                  <div style={{
                    background: plan.name === 'Pro' ? '#f8f8f8' : '#efebe5',
                    borderRadius: 12,
                    padding: "20px",
                    marginTop: "auto",
                    position: "relative"
                  }}>
                    <ArrowUpRight size={18} color="#1a1a1a" style={{ position: "absolute", top: 16, right: 16 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>
                      UNLIMITED, ALL YEAR
                    </div>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                      Save credits on 30+ models
                    </div>
                    
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                      {plan.unlimitedFeatures.map(uf => (
                        <li key={uf.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#1a1a1a" }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 14, height: 14, background: "#e5e5e5", borderRadius: "50%" }}></div>
                            {uf.label}
                          </span>
                          <span style={{ 
                            background: "#fae8c8", 
                            color: "#966f33", 
                            padding: "4px 10px", 
                            borderRadius: 12, 
                            fontSize: 10, 
                            fontWeight: 700,
                            letterSpacing: "0.02em"
                          }}>
                            {uf.badge}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!plan.unlimitedFeatures || plan.unlimitedFeatures.length === 0) && (
                  <div style={{
                    background: 'rgba(239, 235, 229, 0.4)',
                    borderRadius: 12,
                    padding: "20px",
                    marginTop: "auto",
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#a3a3a3", marginBottom: 4 }}>
                      UNLIMITED, ALL YEAR
                    </div>
                    <div style={{ fontSize: 13, color: "#b3b3b3", marginBottom: 16 }}>
                      Save credits on 30+ models
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                      <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#b3b3b3" }}>
                        <X size={14} strokeWidth={2} />
                        <span>Advanced features limited</span>
                      </li>
                      <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#b3b3b3" }}>
                        <X size={14} strokeWidth={2} />
                        <span>Basic support only</span>
                      </li>
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#666" }}>
          Prices exclude VAT and local taxes
        </div>
      </div>
    </section>
  );
}

