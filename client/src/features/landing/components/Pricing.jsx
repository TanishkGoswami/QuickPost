import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Sparkles, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

const PLANS = [
  {
    name: "Free",
    id: "free",
    price: { monthly: 0, annual: 0 },
    description: "Perfect for getting started with basic scheduling.",
    icon: <Zap size={20} />,
    features: [
      "3 connected social accounts",
      "10 posts per month",
      "Basic scheduling",
      "7-day post history",
    ],
    cta: "Get started free",
    highlighted: false,
  },
  {
    name: "Pro",
    id: "999",
    price: { monthly: 999, annual: 799 },
    description: "For creators who broadcast seriously.",
    icon: <Sparkles size={20} />,
    features: [
      "10 connected social accounts",
      "Unlimited posts",
      "Smart scheduling & timezone sync",
      "Analytics dashboard",
      "90-day post history",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    id: "2999",
    price: { monthly: 2999, annual: 2399 },
    description: "For teams and agencies at scale.",
    icon: <Building2 size={20} />,
    features: [
      "Unlimited connected accounts",
      "Unlimited posts",
      "Advanced analytics & exports",
      "Team collaboration (5 seats)",
      "Custom integrations",
      "Dedicated account support",
    ],
    cta: "Start Enterprise",
    highlighted: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [billing, setBilling] = useState("monthly");
  const [upgrading, setUpgrading] = useState(null);

  const handleUpgrade = async (plan) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (plan.id === "free") {
      navigate("/dashboard");
      return;
    }

    try {
      setUpgrading(plan.id);

      const { data, error } = await supabase.functions.invoke(
        "create-payment-link",
        {
          body: {
            planId: plan.id,
            userId: user.userId,
            customerName: user.name,
            customerEmail: user.email,
          },
        },
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

  return (
    <section
      id="pricing"
      className="landing-section"
      style={{ padding: "80px 24px", background: "var(--canvas)" }}
    >
      <div
        className="landing-container"
        style={{ maxWidth: 1280, margin: "0 auto" }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: "center",
            marginBottom: "clamp(40px, 6vw, 56px)",
          }}
        >
          <div
            className="eyebrow"
            style={{ justifyContent: "center", marginBottom: 16 }}
          >
            Pricing
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.03em",
              margin: "0 0 14px",
              lineHeight: 1.1,
            }}
          >
            Simple, honest pricing.
          </h2>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 17px)",
              fontWeight: 450,
              color: "var(--slate)",
              maxWidth: 460,
              margin: "0 auto 28px",
              lineHeight: 1.5,
            }}
          >
            Start free, scale when you're ready. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--canvas-lifted)",
              border: "1px solid rgba(20,20,19,0.08)",
              borderRadius: "var(--r-pill)",
              padding: 4,
            }}
          >
            {["monthly", "annual"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: "7px 20px",
                  borderRadius: "var(--r-pill)",
                  border: "none",
                  fontFamily: "var(--font)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: billing === b ? "var(--ink)" : "transparent",
                  color: billing === b ? "var(--canvas)" : "var(--slate)",
                  letterSpacing: "-0.01em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {b === "monthly" ? "Monthly" : "Annual"}
                {b === "annual" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "var(--r-pill)",
                      background:
                        billing === "annual"
                          ? "rgba(243,115,56,0.2)"
                          : "rgba(243,115,56,0.12)",
                      color: "var(--arc)",
                    }}
                  >
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                borderRadius: "var(--r-hero)",
                border: plan.highlighted
                  ? "none"
                  : "1px solid rgba(20,20,19,0.08)",
                background: plan.highlighted
                  ? "var(--ink)"
                  : "var(--canvas-lifted)",
                padding: "clamp(24px, 3.5vw, 32px)",
                position: "relative",
                boxShadow: plan.highlighted
                  ? "0 32px 64px -16px rgba(20,20,19,0.2)"
                  : "none",
                transform: plan.highlighted ? "scale(1.03)" : "scale(1)",
              }}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--arc)",
                    color: "var(--white)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    padding: "5px 14px",
                    borderRadius: "0 0 var(--r-chip) var(--r-chip)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: plan.highlighted
                    ? "rgba(243,115,56,0.18)"
                    : "var(--ink)",
                  color: plan.highlighted ? "var(--arc)" : "var(--canvas)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                {plan.icon}
              </div>

              {/* Name + desc */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: plan.highlighted ? "var(--canvas)" : "var(--ink)",
                    letterSpacing: "-0.02em",
                    marginBottom: 5,
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 450,
                    color: plan.highlighted
                      ? "rgba(243,240,238,0.55)"
                      : "var(--slate)",
                    lineHeight: 1.5,
                  }}
                >
                  {plan.description}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{ display: "flex", alignItems: "flex-end", gap: 4 }}
                >
                  <span
                    style={{
                      fontSize: "clamp(36px, 4vw, 48px)",
                      fontWeight: 600,
                      lineHeight: 1,
                      color: plan.highlighted ? "var(--canvas)" : "var(--ink)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    ₹{plan.price[billing]}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 450,
                      color: plan.highlighted
                        ? "rgba(243,240,238,0.45)"
                        : "var(--slate)",
                      marginBottom: 5,
                    }}
                  >
                    {plan.price[billing] === 0 ? "forever" : "/ mo"}
                  </span>
                </div>
                {billing === "annual" && plan.price.monthly > 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--arc)",
                      marginTop: 4,
                    }}
                  >
                    Billed ₹{plan.price.annual * 12}/yr · Save ₹
                    {(plan.price.monthly - plan.price.annual) * 12}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={upgrading === plan.id}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: "var(--r-btn)",
                  border: plan.highlighted
                    ? "none"
                    : "1px solid rgba(20,20,19,0.12)",
                  background: plan.highlighted
                    ? "var(--canvas)"
                    : "transparent",
                  color: "var(--ink)",
                  fontFamily: "var(--font)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: 24,
                  opacity: upgrading === plan.id ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (plan.highlighted)
                    e.currentTarget.style.transform = "scale(1.02)";
                  else e.currentTarget.style.background = "rgba(20,20,19,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  if (!plan.highlighted)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {upgrading === plan.id ? "Processing..." : plan.cta}
              </button>

              {/* Divider */}
              <div
                style={{
                  borderTop: `1px solid ${plan.highlighted ? "rgba(243,240,238,0.1)" : "rgba(20,20,19,0.07)"}`,
                  marginBottom: 20,
                }}
              />

              {/* Features list */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 11,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: plan.highlighted
                          ? "rgba(243,115,56,0.18)"
                          : "rgba(20,20,19,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 1,
                      }}
                    >
                      <Check
                        size={11}
                        color={plan.highlighted ? "var(--arc)" : "var(--ink)"}
                        strokeWidth={2.5}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 450,
                        color: plan.highlighted
                          ? "rgba(243,240,238,0.7)"
                          : "var(--slate)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            textAlign: "center",
            fontSize: 13,
            fontWeight: 450,
            color: "var(--slate)",
            marginTop: 32,
          }}
        >
          All plans include a 3-day free trial on paid tiers. No credit card
          required to start.
        </motion.p>
      </div>
    </section>
  );
}
