import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../features/landing';
import logo from '/logo.png';
import {
  Shield,
  Eye,
  FileText,
  Lock,
  Trash2,
  UserCheck,
  Facebook,
  Youtube,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail
} from 'lucide-react';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction', icon: <Shield size={16} strokeWidth={2.5} /> },
  { id: 'collection', title: '2. Information Collection', icon: <Eye size={16} strokeWidth={2.5} /> },
  { id: 'usage', title: '3. Data Usage', icon: <FileText size={16} strokeWidth={2.5} /> },
  { id: 'platforms', title: '4. Platform Specifics', icon: <Share2 size={16} strokeWidth={2.5} /> },
  { id: 'deletion', title: '5. Data Deletion', icon: <Trash2 size={16} strokeWidth={2.5} /> },
  { id: 'security', title: '6. Data Security', icon: <Lock size={16} strokeWidth={2.5} /> },
  { id: 'rights', title: '7. Your Rights', icon: <UserCheck size={16} strokeWidth={2.5} /> },
  { id: 'contact', title: '8. Contact Us', icon: <Mail size={16} strokeWidth={2.5} /> },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-10% 0px -70% 0px' }
    );

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', fontFamily: 'var(--font)', display: 'flex', flexDirection: 'column' }}>
      <LandingNav />

      <main style={{ flexGrow: 1, padding: '48px 24px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <aside className="hidden lg:block w-full max-w-[300px] shrink-0">
            <div style={{ position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--slate)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}>
                ← Back to Home
              </Link>

              <nav style={{ background: 'var(--canvas-lifted)', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20,20,19,0.08)', overflow: 'hidden' }}>
                <p style={{ padding: '12px 16px', margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', borderBottom: '1px solid rgba(20,20,19,0.08)', background: 'rgba(20,20,19,0.02)' }}>
                  Contents
                </p>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                        borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                        fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all 0.15s',
                        background: activeSection === section.id ? 'var(--ink)' : 'transparent',
                        color: activeSection === section.id ? 'var(--canvas)' : 'var(--slate)',
                      }}
                      onMouseEnter={e => { if (activeSection !== section.id) { e.currentTarget.style.background = 'rgba(20,20,19,0.04)'; e.currentTarget.style.color = 'var(--ink)'; } }}
                      onMouseLeave={e => { if (activeSection !== section.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate)'; } }}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </nav>

              <div style={{ padding: 24, background: 'var(--ink)', borderRadius: 'var(--r-btn)', color: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
                <svg aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.2 }} viewBox="0 0 200 200" preserveAspectRatio="none">
                   <path d="M 100 -50 Q 200 50 250 150" stroke="#F37338" strokeWidth="2" fill="none" />
                </svg>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Support</p>
                  <p style={{ fontSize: 14, fontWeight: 450, color: 'rgba(243,240,238,0.7)', margin: '0 0 20px', lineHeight: 1.5 }}>Questions? Contact our legal team for assistance.</p>
                  <a href="mailto:0127cs211072@gmail.com" style={{ display: 'block', textAlign: 'center', background: 'var(--canvas)', color: 'var(--ink)', fontWeight: 600, fontSize: 13, padding: '12px', borderRadius: 'var(--r-sm)', textDecoration: 'none', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article style={{ flex: 1, background: 'var(--canvas-lifted)', border: '1px solid rgba(20,20,19,0.08)', borderRadius: 'var(--r-hero)', padding: 'clamp(32px, 5vw, 64px)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Watermark Logo Ghost */}
            <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.03, pointerEvents: 'none' }}>
              <Shield size={400} strokeWidth={1} />
            </div>

            <header style={{ marginBottom: 64, paddingBottom: 48, borderBottom: '1px solid rgba(20,20,19,0.08)', position: 'relative', zIndex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <img src={logo} alt="GAP Social-pilot" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  <div style={{ padding: '6px 12px', background: 'rgba(20,20,19,0.06)', borderRadius: 'var(--r-pill)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink)' }}>
                    Privacy First
                  </div>
               </div>
               <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 24px', lineHeight: 1.1 }}>Privacy Policy</h1>
               <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--slate)', margin: 0, fontWeight: 500 }}>
                 <RefreshCw size={14} />
                 Last updated: <span style={{ color: 'var(--ink)', fontWeight: 700 }}>December 29, 2025</span>
               </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 64, position: 'relative', zIndex: 1 }}>

              <section id="introduction" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)' }}>
                    <Shield size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>1. Introduction</h2>
                </div>
                <div style={{ color: 'var(--Charcoal)', fontSize: 16, lineHeight: 1.6, fontWeight: 450, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ margin: 0 }}>Welcome to <strong style={{ fontWeight: 600 }}>GAP Social-pilot</strong>. We are a social publishing tool that allows you to connect your social media accounts and broadcast content. We are committed to protecting your personal information and your right to privacy.</p>
                  <p style={{ margin: 0 }}>When you visit our website and use our services, you trust us with your personal information. This privacy policy describes what information we collect, how we use it, and what rights you have in relation to it.</p>
                </div>
              </section>

              <section id="collection" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)' }}>
                    <Eye size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>2. Information Collection</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                  {[
                    { title: 'Account Identity', desc: 'We store your Email, Name, and unique User ID provided by authentication services for account management.' },
                    { title: 'OAuth Tokens', desc: 'Secure access and refresh tokens for connected social platforms to allow automated posting on your behalf.' },
                    { title: 'Content Data', desc: 'Captions, images, videos, and page IDs required to facilitate broadcasting to your selected social channels.' },
                    { title: 'Diagnostics', desc: 'Error logs and timestamps to ensure service reliability and debug application issues.' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 24, background: 'var(--canvas)', border: '1px solid rgba(20,20,19,0.08)', borderRadius: 'var(--r-btn)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(20,20,19,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(20,20,19,0.08)'}
                    >
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                         <CheckCircle2 size={16} color="var(--arc)" strokeWidth={3} />
                         {item.title}
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.5, margin: 0, fontWeight: 450 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="usage" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)' }}>
                    <FileText size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>3. Data Usage</h2>
                </div>
                <p style={{ fontSize: 16, color: 'var(--Charcoal)', margin: '0 0 32px' }}>We utilize the collected information strictly for service operations:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    'Authenticating your sessions and maintaining account security.',
                    'Posting media and text content to third-party social APIs.',
                    'Monitoring post performance and broadcasting status.',
                    'Responding to support queries and technical issues.'
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 20, background: 'var(--canvas)', borderRadius: 'var(--r-btn)', border: '1px solid rgba(20,20,19,0.08)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', color: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="platforms" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)' }}>
                    <Share2 size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>4. Platform Specifics</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ padding: 32, border: '1px solid rgba(20,20,19,0.1)', background: 'var(--canvas)', borderRadius: 'var(--r-hero)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04 }}>
                      <Youtube size={160} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', marginBottom: 16 }}>
                      <Youtube size={16} /> Google & YouTube
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500, margin: 0, position: 'relative', zIndex: 1 }}>
                      GAP Social-pilot uses YouTube API Services. By using our tool, you agree to the <a href="https://policies.google.com/privacy" style={{ color: 'var(--arc)', textDecoration: 'underline' }}>Google Privacy Policy</a> and <a href="https://www.youtube.com/t/terms" style={{ color: 'var(--arc)', textDecoration: 'underline' }}>YouTube Terms of Service</a>. We only access data you explicitly grant during authorization.
                    </p>
                  </div>

                  <div style={{ padding: 32, border: '1px solid rgba(20,20,19,0.1)', background: 'var(--canvas)', borderRadius: 'var(--r-hero)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04 }}>
                      <Facebook size={160} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', marginBottom: 16 }}>
                      <Facebook size={16} /> Meta (Facebook/Instagram/Threads)
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500, margin: 0, position: 'relative', zIndex: 1 }}>
                      We comply strictly with Meta Platform Policies. Access is limited to tokens specifically granted for publishing and managing pages/accounts linked to your workspace.
                    </p>
                  </div>

                  <div style={{ padding: 32, border: '1px solid rgba(20,20,19,0.1)', background: 'var(--canvas)', borderRadius: 'var(--r-hero)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04 }}>
                      <ImageIcon size={160} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate)', marginBottom: 16 }}>
                      <ImageIcon size={16} /> Pinterest & Others
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500, margin: 0, position: 'relative', zIndex: 1 }}>
                      We use official APIs for Pinterest and Bluesky to automate content delivery. No data is sold or shared with external parties beyond what is required for the integration to function.
                    </p>
                  </div>
                </div>
              </section>

              <section id="deletion" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--signal)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Trash2 size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>5. Data Deletion</h2>
                </div>
                <div style={{ padding: 40, background: 'var(--ink)', borderRadius: 'var(--r-hero)', color: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
                  <svg aria-hidden="true" style={{ position: 'absolute', right: -50, bottom: -50, opacity: 0.3, pointerEvents: 'none' }} width="300" height="300" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" stroke="var(--signal)" strokeWidth="2" fill="none" strokeDasharray="10 10" />
                  </svg>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: 20, fontWeight: 600, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AlertCircle color="var(--signal)" />
                      Right to be forgotten
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 450, color: 'rgba(243,240,238,0.7)', lineHeight: 1.6, margin: '0 0 32px' }}>
                      You have full control over your data. You can disconnect any platform or request full account deletion at any time.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ flex: '1 1 240px', padding: 24, background: 'rgba(243,240,238,0.05)', border: '1px solid rgba(243,240,238,0.1)', borderRadius: 'var(--r-btn)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Option 1</p>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Disconnect accounts via the Dashboard.</p>
                      </div>
                      <div style={{ flex: '1 1 240px', padding: 24, background: 'rgba(243,240,238,0.05)', border: '1px solid rgba(243,240,238,0.1)', borderRadius: 'var(--r-btn)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Option 2</p>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Email <a href="mailto:0127cs211072@gmail.com" style={{ color: 'var(--arc)', textDecoration: 'none' }}>0127cs211072@gmail.com</a> for full deletion.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="security" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)' }}>
                    <Lock size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>6. Data Security</h2>
                </div>
                <div style={{ padding: 32, border: '2px dashed rgba(20,20,19,0.15)', borderRadius: 'var(--r-hero)' }}>
                  <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                    We implement industry-standard security measures, including <strong style={{ fontWeight: 700 }}>AES-256 encryption</strong> for all OAuth tokens and secure HTTPS communication for all data transfers. Access to our internal database is strictly limited and audited.
                  </p>
                </div>
              </section>

              <section id="rights" style={{ scrollMarginTop: 120 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)' }}>
                    <UserCheck size={20} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>7. Your Rights</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {['Access Info', 'Correct Errors', 'Request Deletion', 'Data Portability', 'Withdraw Consent'].map(r => (
                    <div key={r} style={{ padding: '10px 20px', background: 'var(--canvas)', border: '1px solid rgba(20,20,19,0.1)', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="var(--arc)" strokeWidth={3} />
                      {r}
                    </div>
                  ))}
                </div>
              </section>

               <section id="contact" style={{ scrollMarginTop: 120, paddingTop: 48, borderTop: '1px solid rgba(20,20,19,0.08)' }}>
                <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-hero)', padding: 64, textAlign: 'center', color: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
                   {/* Orbital Arc Background */}
                  <svg aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.4 }} viewBox="0 0 1000 400" preserveAspectRatio="none">
                    <path d="M -50 320 Q 250 60 600 280 Q 800 400 1100 150" stroke="#F37338" strokeWidth="1.5" fill="none" />
                  </svg>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 24px' }}>Have more questions?</h2>
                    <p style={{ fontSize: 16, fontWeight: 450, color: 'rgba(243,240,238,0.7)', margin: '0 auto 40px', maxWidth: 500, lineHeight: 1.5 }}>
                      Our team is here to help you understand how we protect your data. Reach out to us anytime.
                    </p>
                    <a href="mailto:0127cs211072@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', background: 'var(--canvas)', color: 'var(--ink)', borderRadius: 'var(--r-btn)', fontSize: 15, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <Mail size={18} />
                      Shoot an Email
                    </a>
                  </div>
                </div>
              </section>

            </div>
          </article>
        </div>
      </main>

      {/* Footer matches LandingPage */}
      <footer style={{ background: 'var(--canvas)', borderTop: '1px solid rgba(20,20,19,0.08)', padding: '32px 32px' }}>
        <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 450, color: 'var(--slate)' }}>
              © 2026 GAP Social-pilot. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Link to="/privacy" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
              <Link to="/terms" style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--slate)'}>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
