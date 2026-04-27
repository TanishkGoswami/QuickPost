import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import logo from "/logo.png";
import InteractiveButton from "../../../components/ui/InteractiveButton.jsx";

export default function LandingNav() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: "0 20px",
          pointerEvents: "none",
        }}
      >
        <motion.div
          animate={{
            backgroundColor: scrolled ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: scrolled ? "0 4px 24px -1px rgba(0, 0, 0, 0.05), 0 0 1px 0 rgba(0, 0, 0, 0.1)" : "0 0 0 rgba(0,0,0,0)",
            marginTop: scrolled ? 12 : 16,
            borderRadius: scrolled ? "24px" : "20px",
            border: scrolled ? "1px solid rgba(255, 255, 255, 0.5)" : "none",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px 8px 20px",
            pointerEvents: "auto", // Re-enable clicks for the actual nav bar
          }}
        >
          {/* Logo Section */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <img
                src={logo}
                alt="Logo"
                style={{ height: 32, width: 32, objectFit: "contain", position: "relative", zIndex: 2 }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  background: "var(--arc)",
                  borderRadius: "50%",
                  filter: "blur(8px)",
                  opacity: 0.2
                }}
              />
            </div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.03em",
                whiteSpace: "nowrap",
              }}
            >
              GAP Social‑pilot
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(20,20,19,0.03)",
                padding: "4px",
                borderRadius: "14px",
                gap: 4
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--slate)",
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.8)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--slate)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <>
                <Link
                  to="/login"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    textDecoration: "none",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(20,20,19,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Sign in
                </Link>
                <InteractiveButton
                  onClick={() => navigate("/login")}
                  style={{ fontSize: 13, height: 40 }}
                >
                  Get started
                </InteractiveButton>
              </>
            )}

            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "rgba(20,20,19,0.04)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              top: scrolled ? 80 : 100,
              left: 20,
              right: 20,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              zIndex: 999,
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--ink)",
                    textDecoration: "none",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "rgba(20,20,19,0.02)",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  background: "rgba(20,20,19,0.04)",
                  border: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                Sign in
              </button>
              <InteractiveButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
                style={{ width: "100%", fontSize: 16 }}
              >
                Get started — Free
              </InteractiveButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
