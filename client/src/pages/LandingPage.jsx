import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hero, Features, HowItWorks, SocialProof, CallToAction, LandingNav } from '../features/landing';
import '../styles/landing.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', fontFamily: 'var(--font)' }}>
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <CallToAction />

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

