import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  animate,
  useMotionValue,
} from "framer-motion";
import { FloatingPaths } from "../../../components/ui/BackgroundPaths";
import InteractiveButton from "../../../components/ui/InteractiveButton.jsx";

const PLATFORMS = [
  { src: "/icons/ig-instagram-icon.svg", label: "Instagram" },
  { src: "/icons/youtube-color-icon.svg", label: "YouTube" },
  { src: "/icons/x-social-media-round-icon.svg", label: "X" },
  { src: "/icons/linkedin-icon.svg", label: "LinkedIn" },
  { src: "/icons/facebook-round-color-icon.svg", label: "Facebook" },
  { src: "/icons/snapchat-square-color-icon.svg", label: "Snapchat" },
  { src: "/icons/google-icon.svg", label: "Google" },
  { src: "/icons/reddit-icon.svg", label: "Reddit" },
  { src: "/icons/pinterest-round-color-icon.svg", label: "Pinterest" },
  { src: "/icons/threads-icon.svg", label: "Threads" },
  { src: "/icons/bluesky-circle-color-icon.svg", label: "Bluesky" },
  { src: "/icons/mastodon-round-icon.svg", label: "Mastodon" },
];

export default function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [platformCount, setPlatformCount] = useState(0);
  const flowValue = useMotionValue(0);

  // Scroll-based animations
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  // Scroll-linked reveal and travel
  const arcProgress = useSpring(
    useTransform(scrollYProgress, [0, 0.5], [0, 1]),
    {
      stiffness: 40,
      damping: 20,
    }
  );

  const travelProgress = useTransform(scrollYProgress, [0, 1], [0, 1000]);

  // Flow animation (continuous subtle movement) - keeping it very slow or removing if desired
  useEffect(() => {
    const controls = animate(flowValue, [0, 1000], {
      duration: 60,
      repeat: Infinity,
      ease: "linear",
    });
    return () => controls.stop();
  }, [flowValue]);

  useEffect(() => {
    const controls = animate(0, 11, {
      duration: 2,
      delay: 0.8,
      ease: "easeOut",
      onUpdate: (value) => setPlatformCount(Math.floor(value)),
    });
    return () => controls.stop();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-bg landing-section"
      style={{
        padding: "clamp(180px, 30vh, 240px) 20px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Amber Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b20 100%)",
          backgroundSize: "100% 100%",
          pointerEvents: "none",
        }}
      />

      {/* Enhanced Orbital Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <svg
          aria-hidden="true"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          viewBox="0 0 1400 700"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F37338" stopOpacity="0" />
              <stop offset="30%" stopColor="#F37338" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#F37338" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F37338" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Arcs */}
          <motion.path
            style={{
              pathLength: arcProgress,
              strokeDashoffset: travelProgress,
            }}
            d="M -100 550 Q 400 100 900 500 Q 1200 750 1600 300"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="300 150"
          />
          <motion.path
            style={{ pathLength: arcProgress, strokeDashoffset: useTransform(travelProgress, v => -v) }}
            d="M 100 680 Q 450 300 1000 600 Q 1300 800 1700 400"
            stroke="#F37338"
            strokeWidth="1.5"
            fill="none"
            opacity="0.2"
            strokeDasharray="200 100"
          />
          <motion.path
            style={{
              pathLength: arcProgress,
              strokeDashoffset: useTransform(travelProgress, v => v * 0.5),
            }}
            d="M -200 400 Q 300 50 800 450"
            stroke="#F37338"
            strokeWidth="1"
            fill="none"
            opacity="0.15"
            strokeDasharray="150 75"
          />

          {/* Floating Nodes */}
          <motion.circle
            animate={{
              x: [0, 40, 0],
              y: [0, -35, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            cx="820"
            cy="480"
            r="5"
            fill="#F37338"
          />
          <motion.circle
            animate={{
              x: [0, -50, 0],
              y: [0, 30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            cx="360"
            cy="120"
            r="4"
            fill="#F37338"
          />
        </svg>
      </div>

      <div
        className="landing-container"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Ghost watermark */}
        <motion.div
          className="watermark"
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            x: "-50%",
            whiteSpace: "nowrap",
            fontSize: "clamp(64px, 12vw, 150px)",
            opacity: 0.1,
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "-0.04em",
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: "2px var(--ink)",
            textAlign: "center",
            y: watermarkY,
          }}
        >
          Broadcast
        </motion.div>

        {/* Main content */}
        <div
          style={{
            textAlign: "center",
            maxWidth: 860,
            margin: "0 auto 48px",
            position: "relative",
          }}
        >
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1
              style={{
                fontSize: "clamp(40px, 8.5vw, 92px)",
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.045em",
                lineHeight: 1.05,
                margin: "0 0 24px",
              }}
            >
              One post.
              <br />
              <span style={{ color: "var(--arc)" }}>Every platform.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: "clamp(15px, 2.2vw, 19px)",
              fontWeight: 450,
              color: "var(--slate)",
              lineHeight: 1.55,
              margin: "0 0 36px",
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            GAP Social‑pilot broadcasts your content to Instagram, YouTube,
            LinkedIn + 8 more — simultaneously, with zero friction.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            <InteractiveButton
              onClick={() => navigate("/login")}
              style={{ fontSize: 16 }}
            >
              Start broadcasting free
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                style={{ marginLeft: 6 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </InteractiveButton>
            <a
              href="#how-it-works"
              className="btn-outline"
              style={{ fontSize: 16, padding: "14px 28px" }}
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Platform logos pill strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--slate)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Broadcasts to
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              background: "var(--canvas-lifted)",
              border: "1px solid rgba(20,20,19,0.08)",
              borderRadius: "var(--r-pill)",
              padding: "7px 14px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
            }}
          >
            {PLATFORMS.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.55 + i * 0.04,
                  ease: "backOut",
                }}
                title={p.label}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--white)",
                  border: "1.5px solid var(--canvas)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: PLATFORMS.length - i,
                  position: "relative",
                  cursor: "pointer",
                }}
                whileHover={{ y: -3, scale: 1.1 }}
              >
                <img
                  src={p.src}
                  alt={p.label}
                  style={{ width: 18, height: 18, objectFit: "contain" }}
                />
              </motion.div>
            ))}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--arc)",
                marginLeft: 10,
                whiteSpace: "nowrap",
              }}
            >
              + more
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            maxWidth: 800,
            margin: "60px auto 0",
          }}
        >
          {[
            { value: platformCount + "+", label: "Platforms" },
            { value: "1-click", label: "Broadcast" },
            { value: "∞", label: "Scheduling" },
          ].map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.65 + i * 0.12,
                ease: "easeOut",
              }}
              style={{
                background: "var(--canvas-lifted)",
                border: "1px solid rgba(20,20,19,0.08)",
                borderRadius: "var(--r-hero)",
                padding: "24px 20px",
                textAlign: "center",
                boxShadow: "var(--shadow-nav)",
                cursor: "default",
              }}
              whileHover={{ y: -2 }}
            >
              <div
                style={{
                  fontSize: "clamp(28px, 4vw, 36px)",
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--slate)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes hero-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
      `}</style>
    </section>
  );
}
