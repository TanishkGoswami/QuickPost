import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '/logo.png';

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      <nav
        className="landing-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: scrolled ? '0 10px 30px -10px rgba(0,0,0,0.05)' : 'none',
          background: scrolled ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(20,20,19,0.06)' : '1px solid transparent',
        }}
      >
        <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: scrolled ? '10px 24px' : '20px 24px', maxWidth: 1280, margin: '0 auto', transition: 'padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={logo} alt="GAP Social-pilot" style={{ height: 32, width: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
              GAP Social‑pilot
            </span>
          </Link>

          {/* Desktop Links */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate)', textDecoration: 'none', transition: 'color 0.15s', letterSpacing: '-0.01em' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* CTA & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  to="/login"
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', padding: '8px 16px', borderRadius: 'var(--r-btn)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,20,19,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Sign in
                </Link>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-ink"
                  style={{ fontSize: 14, padding: '8px 20px' }}
                >
                  Get started
                </button>
              </div>
            )}

            {/* Hamburger */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  width: 40, height: 40, borderRadius: 'var(--r-btn)',
                  border: '1px solid rgba(20,20,19,0.08)',
                  background: scrolled ? 'var(--white)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)', cursor: 'pointer'
                }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
              background: 'var(--canvas)', zIndex: 99,
              padding: '24px', display: 'flex', flexDirection: 'column', gap: 32
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', letterSpacing: '-0.03em' }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                style={{ width: '100%', padding: '16px', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20,20,19,0.1)', background: 'transparent', fontSize: 16, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
              >
                Sign in
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="btn-ink"
                style={{ width: '100%', padding: '16px', borderRadius: 'var(--r-btn)', fontSize: 16, fontWeight: 600 }}
              >
                Get started — Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
