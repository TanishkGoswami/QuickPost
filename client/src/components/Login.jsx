import { motion } from 'framer-motion';
import logo from '/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: 'var(--font)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Ghost watermark ── */}
      <div
        className="watermark"
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontSize: 'clamp(72px, 10vw, 140px)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        GAP Social‑pilot
      </div>

      {/* ── Orbital arc SVG ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
      >
        <path
          d="M -100 500 Q 350 150 800 480 Q 1050 680 1350 300"
          stroke="#F37338"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M 50 700 Q 400 300 900 600"
          stroke="#F37338"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
      </svg>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo + brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 12px 40px rgba(20,20,19,0.18)',
            }}
          >
            <img src={logo} alt="GAP Social-pilot" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          </motion.div>
          <h1
            style={{
              fontSize: 40,
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
              fontSize: 16,
              fontWeight: 450,
              color: 'var(--slate)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            One post. Every platform. Instant.
          </p>
        </div>

        {/* Stadium login card */}
        <div
          style={{
            background: 'var(--canvas-lifted)',
            borderRadius: 'var(--r-hero)',
            padding: 'clamp(24px, 8vw, 40px) clamp(20px, 8vw, 40px) clamp(24px, 8vw, 32px)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid rgba(20,20,19,0.07)',
          }}
        >
          {/* Eyebrow */}
          <div className="eyebrow" style={{ marginBottom: 12 }}>Sign in</div>
          <h2
            style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: '0 0 6px',
            }}
          >
            Continue with Google
          </h2>
          <p style={{ fontSize: 'clamp(13px, 4vw, 14px)', fontWeight: 450, color: 'var(--slate)', margin: '0 0 28px' }}>
            Connect your Google account to get started
          </p>

          {/* Google button */}
          <motion.button
            whileHover={{ opacity: 0.88 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '14px 24px',
              background: 'var(--white)',
              border: '1.5px solid var(--ink)',
              borderRadius: 'var(--r-btn)',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              marginBottom: 16,
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </motion.button>

          {/* Primary ink button */}
          <button
            className="btn-ink"
            style={{ width: '100%', fontSize: 15, padding: '13px 24px' }}
            onClick={handleGoogleLogin}
          >
            Get started — it's free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(20,20,19,0.08)', margin: '28px 0 20px' }} />

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Broadcast to Instagram, YouTube, LinkedIn & more',
              'Schedule posts across timezones',
              'Track analytics from one dashboard',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', color: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 450, color: 'var(--slate)', margin: 0, lineHeight: 1.4 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--dust)', marginTop: 20, lineHeight: 1.5 }}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
