import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Check,
  Monitor, BarChart2, Wrench, Target, Bot, MoreHorizontal,
  User, Store, Building2, Briefcase, Megaphone, Heart,
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import logo from '/logo.png';

/* ── Platform data ── */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram',      icon: '/icons/ig-instagram-icon.svg' },
  { id: 'facebook',  label: 'Facebook',        icon: '/icons/facebook-round-color-icon.svg' },
  { id: 'x',         label: 'X / Twitter',     icon: '/icons/x-social-media-round-icon.svg', comingSoon: true },
  { id: 'linkedin',  label: 'LinkedIn',        icon: '/icons/linkedin-icon.svg' },

  { id: 'youtube',   label: 'YouTube',         icon: '/icons/youtube-color-icon.svg' },
  { id: 'pinterest', label: 'Pinterest',       icon: '/icons/pinterest-round-color-icon.svg', comingSoon: true },
  { id: 'threads',   label: 'Threads',         icon: '/icons/threads-icon.svg' },
  { id: 'bluesky',   label: 'Bluesky',         icon: '/icons/bluesky-circle-color-icon.svg' },
  { id: 'mastodon',  label: 'Mastodon',        icon: '/icons/mastodon-round-icon.svg' },
  { id: 'google',    label: 'Google Business', icon: '/icons/google-icon.svg', comingSoon: true },
  { id: 'reddit',    label: 'Reddit',          icon: '/icons/reddit-icon.svg', comingSoon: true },
];

const TOOLS = [
  { id: 'none',     label: 'I post directly to each platform',  sub: null,                               Icon: Monitor      },
  { id: 'meta',     label: 'Meta Business Suite',               sub: null,                               Icon: BarChart2    },
  { id: 'smm',      label: 'Social Media Management tool',      sub: 'Hootsuite, Sprout Social, Later…', Icon: Wrench       },
  { id: 'specific', label: 'Platform-specific tools',           sub: 'Typefully, Hypefury…',             Icon: Target       },
  { id: 'ai',       label: 'AI Platforms',                      sub: 'ChatGPT, Claude…',                 Icon: Bot          },
  { id: 'other',    label: 'Other',                             sub: null,                               Icon: MoreHorizontal },
];

const USER_TYPES = [
  { id: 'solo',      label: 'Solo creator',               Icon: User           },
  { id: 'small_biz', label: 'Small business owner',       Icon: Store          },
  { id: 'marketing', label: 'Part of a marketing team',   Icon: Building2      },
  { id: 'freelance', label: 'Freelancer / consultant',    Icon: Briefcase      },
  { id: 'agency',    label: 'Marketing agency',           Icon: Megaphone      },
  { id: 'nonprofit', label: 'Non-profit organization',    Icon: Heart          },
  { id: 'other',     label: 'Other',                      Icon: MoreHorizontal },
];

const STEPS = [
  { num: 1, title: 'Your platforms', desc: 'Which social channels do you want to manage?' },
  { num: 2, title: 'Your workflow',  desc: 'What tools do you currently use?' },
  { num: 3, title: 'About you',      desc: 'Help us tailor your experience.' },
];

/* ── Shared layout wrapper ── */
function OnboardingShell({ children, step }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--canvas)', fontFamily: 'var(--font)' }}>
      {/* Left panel */}
      <div style={{
        width: 320, flexShrink: 0, background: 'var(--ink)', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '40px 36px',
      }} className="hidden lg:flex">
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(243,240,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logo} alt="GAP Social-pilot" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--canvas)",
              fontFamily: "var(--font-logo)",
              letterSpacing: "-0.02em",
              lineHeight: 0.9,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--arc)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 1 }}>GAP</span>
            <span>Social‑pilot</span>
          </span>
        </Link>

        {/* Step info */}
        {step > 0 && (
          <div>
            {/* Orbital arc hint */}
            <svg style={{ opacity: 0.25, marginBottom: 24 }} width="200" height="80" viewBox="0 0 200 80" fill="none">
              <path d="M -20 60 Q 60 10 160 50 Q 190 65 230 30" stroke="#F37338" strokeWidth="1.5" />
              <circle cx="160" cy="50" r="4" fill="#F37338" />
            </svg>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Step {step} of 3
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 500, color: 'var(--canvas)', letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.1 }}>
              {STEPS[step - 1]?.title}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(243,240,238,0.55)', lineHeight: 1.5, margin: '0 0 36px' }}>
              {STEPS[step - 1]?.desc}
            </p>
            {/* Steps progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STEPS.map(s => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: s.num === step ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: s.num < step ? 'var(--arc)' : s.num === step ? 'rgba(243,240,238,0.15)' : 'transparent',
                    border: `2px solid ${s.num < step ? 'var(--arc)' : s.num === step ? 'var(--canvas)' : 'rgba(243,240,238,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.num < step ? '#fff' : 'var(--canvas)', fontSize: 11, fontWeight: 700,
                  }}>
                    {s.num < step ? <Check size={12} strokeWidth={3} /> : s.num}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.num === step ? 'var(--canvas)' : 'rgba(243,240,238,0.5)' }}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'rgba(243,240,238,0.3)', lineHeight: 1.5 }}>
          You can always update these later in settings.
        </p>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile progress bar */}
        {step > 0 && (
          <div className="lg:hidden" style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(20,20,19,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <img src={logo} alt="" style={{ height: 24, width: 24 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>GAP Social-pilot</span>
              </Link>
              <span style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 600 }}>Step {step}/3</span>
            </div>
            <div style={{ height: 3, background: 'rgba(20,20,19,0.08)', borderRadius: 999 }}>
              <div style={{ height: '100%', background: 'var(--ink)', borderRadius: 999, width: `${(step / 3) * 100}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Continue button ── */
function ContinueBtn({ onClick, active, label = 'Continue' }) {
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={active ? 'btn-ink' : ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 28px', borderRadius: 'var(--r-btn)',
        fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em',
        ...(!active ? {
          background: 'rgba(20,20,19,0.07)', color: 'var(--dust)',
          border: 'none', cursor: 'not-allowed',
        } : {}),
      }}
    >
      {label} {active && <ArrowRight size={15} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedTools, setSelectedTools]       = useState([]);
  const [selectedType, setSelectedType]         = useState(null);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiClient.get('/api/onboarding');
        if (res.data.completed) { localStorage.setItem('qp_onboarding_done', 'true'); navigate('/dashboard', { replace: true }); }
      } catch {
        if (localStorage.getItem('qp_onboarding_done')) navigate('/dashboard', { replace: true });
      }
    };
    check();
  }, [navigate]);

  const finish = async (finalType = selectedType) => {
    try { await apiClient.post('/api/onboarding', { channels: selectedChannels, tools: selectedTools, user_type: finalType, completed: true }); }
    catch (e) { console.error('Onboarding save failed:', e); }
    finally { localStorage.setItem('qp_onboarding_done', 'true'); navigate('/dashboard', { replace: true }); }
  };
  const skip = () => finish(null);
  const toggleChannel = id => setSelectedChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTool = id => setSelectedTools(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  /* ── WELCOME ── */
  if (step === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)', fontFamily: 'var(--font)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative orbital arc */}
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path d="M -80 520 Q 360 120 820 480 Q 1060 680 1500 280" stroke="#F37338" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M 60 650 Q 380 280 940 560" stroke="#F37338" strokeWidth="1" fill="none" opacity="0.2" />
      </svg>

      {/* Ghost platform icons */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[
          { src: '/icons/ig-instagram-icon.svg',   style: { top: '15%', left: '8%',   opacity: 0.12, width: 44 } },
          { src: '/icons/youtube-color-icon.svg',  style: { top: '60%', left: '5%',   opacity: 0.12, width: 40 } },
          { src: '/icons/linkedin-icon.svg',       style: { top: '30%', left: '18%',  opacity: 0.10, width: 32 } },

          { src: '/icons/bluesky-circle-color-icon.svg', style: { top: '20%', right: '8%', opacity: 0.12, width: 36 } },
          { src: '/icons/pinterest-round-color-icon.svg', style: { top: '55%', right: '5%', opacity: 0.12, width: 40 } },
        ].map((icon, i) => (
          <img key={i} src={icon.src} alt="" style={{ position: 'absolute', ...icon.style, filter: 'grayscale(1)' }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '40px 24px', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link
            to="/"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 12px 40px rgba(20,20,19,0.18)',
              textDecoration: 'none'
            }}
          >
            <img src={logo} alt="GAP Social-pilot" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          </Link>
          <h1
            style={{
              fontSize: 'clamp(32px, 8vw, 40px)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              lineHeight: 1.05,
              margin: '0 0 12px',
            }}
          >
            Broadcast<br />everywhere.
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              fontWeight: 450,
              color: 'var(--slate)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            One post. Every platform. Instant.
          </p>
        </div>
        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Setup</div>
        <h1 style={{ fontSize: 44, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 14px' }}>
          Welcome,<br />{firstName}
        </h1>
        <p style={{ fontSize: 16, fontWeight: 450, color: 'var(--slate)', lineHeight: 1.5, margin: '0 0 36px' }}>
          Let's set up GAP Social-pilot for you.<br />It only takes a minute.
        </p>
        <button onClick={() => setStep(1)} className="btn-ink" style={{ fontSize: 16, padding: '13px 36px' }}>
          Get started <ArrowRight size={16} />
        </button>
        <div style={{ marginTop: 16 }}>
          <button onClick={skip} style={{ fontSize: 13, color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Skip setup
          </button>
        </div>
      </div>
    </div>
  );

  /* ── STEP 1: Channels ── */
  if (step === 1) return (
    <OnboardingShell step={1}>
      <div style={{ flex: 1, padding: '48px 40px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>Which channels are you active on?</h1>
        <p style={{ fontSize: 14, color: 'var(--slate)', margin: '0 0 32px' }}>Select all that apply. You can connect accounts after setup.</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
          gap: 12, 
          marginBottom: 36 
        }}>
          {PLATFORMS.map(p => {
            const sel = selectedChannels.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => !p.comingSoon && toggleChannel(p.id)}
                disabled={p.comingSoon}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 8px', borderRadius: 'var(--r-hero)',
                  border: `1.5px solid ${sel ? 'var(--ink)' : 'rgba(20,20,19,0.10)'}`,
                  background: sel ? 'rgba(20,20,19,0.04)' : 'var(--canvas-lifted)',
                  cursor: p.comingSoon ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  opacity: p.comingSoon ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!sel && !p.comingSoon) e.currentTarget.style.borderColor = 'rgba(20,20,19,0.25)'; }}
                onMouseLeave={e => { if (!sel && !p.comingSoon) e.currentTarget.style.borderColor = 'rgba(20,20,19,0.10)'; }}
              >
                {sel && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, background: 'var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={9} color="white" strokeWidth={3} />
                  </div>
                )}
                {p.comingSoon && (
                  <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 800, background: 'var(--arc)', color: 'white', padding: '1px 4px', borderRadius: 4, textTransform: 'uppercase' }}>
                    Soon
                  </div>
                )}
                <img src={p.icon} alt={p.label} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{p.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ContinueBtn onClick={() => setStep(2)} active={selectedChannels.length > 0} />
          <button onClick={skip} style={{ fontSize: 13, color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>Skip</button>
        </div>
      </div>
    </OnboardingShell>
  );

  /* ── STEP 2: Tools ── */
  if (step === 2) return (
    <OnboardingShell step={2}>
      <div style={{ flex: 1, padding: '48px 40px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>What's your current setup?</h1>
        <p style={{ fontSize: 14, color: 'var(--slate)', margin: '0 0 32px' }}>Select all tools you currently use to manage social media.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          {TOOLS.map(t => {
            const sel = selectedTools.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTool(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 'var(--r-hero)',
                  border: `1.5px solid ${sel ? 'var(--ink)' : 'rgba(20,20,19,0.10)'}`,
                  background: sel ? 'rgba(20,20,19,0.04)' : 'var(--canvas-lifted)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(20,20,19,0.25)'; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(20,20,19,0.10)'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-btn)', background: sel ? 'var(--ink)' : 'rgba(20,20,19,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                  <t.Icon style={{ width: 18, height: 18, color: sel ? 'var(--canvas)' : 'var(--slate)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>{t.label}</p>
                  {t.sub && <p style={{ fontSize: 11, color: 'var(--slate)', margin: '2px 0 0' }}>{t.sub}</p>}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${sel ? 'var(--ink)' : 'rgba(20,20,19,0.20)'}`, background: sel ? 'var(--ink)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {sel && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ContinueBtn onClick={() => setStep(3)} active={selectedTools.length > 0} />
          <button onClick={skip} style={{ fontSize: 13, color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>Skip</button>
        </div>
      </div>
    </OnboardingShell>
  );

  /* ── STEP 3: User type ── */
  return (
    <OnboardingShell step={3}>
      <div style={{ flex: 1, padding: '48px 40px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>How would you describe yourself?</h1>
        <p style={{ fontSize: 14, color: 'var(--slate)', margin: '0 0 32px' }}>Choose the option that best fits your role.</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
          gap: 10, 
          marginBottom: 36 
        }}>
          {USER_TYPES.map(u => {
            const sel = selectedType === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedType(u.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 'var(--r-hero)',
                  border: `1.5px solid ${sel ? 'var(--ink)' : 'rgba(20,20,19,0.10)'}`,
                  background: sel ? 'rgba(20,20,19,0.04)' : 'var(--canvas-lifted)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(20,20,19,0.25)'; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'rgba(20,20,19,0.10)'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-btn)', background: sel ? 'var(--ink)' : 'rgba(20,20,19,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                  <u.Icon style={{ width: 16, height: 16, color: sel ? 'var(--canvas)' : 'var(--slate)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1, lineHeight: 1.3 }}>{u.label}</span>
                {sel && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ContinueBtn onClick={() => finish(selectedType)} active={!!selectedType} label="Finish setup" />
          <button onClick={skip} style={{ fontSize: 13, color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>Skip</button>
        </div>
      </div>
    </OnboardingShell>
  );
}
