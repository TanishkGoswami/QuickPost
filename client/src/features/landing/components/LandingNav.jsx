import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '/logo.png';

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="landing-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'box-shadow 0.25s',
        boxShadow: scrolled ? 'var(--shadow-nav)' : 'none',
      }}
    >
      <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={logo} alt="GAP Social-pilot" style={{ height: 32, width: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            GAP Social‑pilot
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden md:flex">
          {['Features', 'How It Works', 'Pricing'].map(label => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate)', textDecoration: 'none', transition: 'color 0.15s', letterSpacing: '-0.01em' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to="/login"
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', padding: '7px 16px', borderRadius: 'var(--r-btn)', transition: 'background 0.15s' }}
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
      </div>
    </nav>
  );
}
