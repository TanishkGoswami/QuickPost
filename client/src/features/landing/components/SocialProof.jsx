import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote: "I used to spend 45 minutes posting to each platform individually. Now it's one click and I'm done.",
    name: 'Sarah K.',
    title: 'Content Creator · 180K followers',
  },
  {
    quote: "The scheduling is rock-solid. Posts go out at exactly the right time even across different timezones.",
    name: 'Marcus T.',
    title: 'Digital Marketing Lead · Agency',
  },
  {
    quote: "Finally a tool that handles YouTube, Instagram, and LinkedIn without me babysitting it.",
    name: 'Priya M.',
    title: 'Founder & Solopreneur',
  },
];

const PLATFORMS = [
  '/icons/ig-instagram-icon.svg',
  '/icons/youtube-color-icon.svg',
  '/icons/x-social-media-round-icon.svg',
  '/icons/linkedin-icon.svg',
  '/icons/tiktok-circle-icon.svg',
  '/icons/facebook-round-color-icon.svg',
  '/icons/pinterest-round-color-icon.svg',
  '/icons/threads-icon.svg',
  '/icons/bluesky-circle-color-icon.svg',
  '/icons/mastodon-round-icon.svg',
];

export default function SocialProof() {
  return (
    <section className="landing-section" style={{ padding: '80px 32px', background: 'var(--canvas)' }}>
      <div className="landing-container" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Testimonials ── */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>From creators</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            Real results, real people
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 72 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: 'var(--canvas-lifted)',
                border: '1px solid rgba(20,20,19,0.07)',
                borderRadius: 'var(--r-hero)',
                padding: '28px',
              }}
            >
              {/* Quote mark */}
              <div style={{ fontSize: 48, fontWeight: 500, color: 'var(--arc)', lineHeight: 1, marginBottom: 12, fontFamily: 'Georgia, serif' }}>"</div>
              <p style={{ fontSize: 15, fontWeight: 450, color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 24px', fontStyle: 'italic' }}>
                {t.quote}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar circle */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--canvas)', fontSize: 14, fontWeight: 700 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)' }}>{t.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Platform logos ── */}
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 24 }}>Broadcasts to</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {PLATFORMS.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="platform-logo"
                style={{ width: 56, height: 56 }}
              >
                <img src={src} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
