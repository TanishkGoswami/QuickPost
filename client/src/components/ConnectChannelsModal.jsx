import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Zap, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BlueskyConnectModal from "./BlueskyConnectModal";
import PinterestConnectModal from "./PinterestConnectModal";
import LinkedInConnectModal from "./LinkedInConnectModal";
import MastodonConnectModal from "./MastodonConnectModal";
import InstagramBusinessSetupModal from "./InstagramBusinessSetupModal";

const SESSION_KEY = "qp_channels_skipped";

const platforms = [
  { id: "instagram",  name: "Instagram",       icon: "/icons/ig-instagram-icon.svg",              type: "oauth-instagram" },
  { id: "facebook",   name: "Facebook",         icon: "/icons/facebook-round-color-icon.svg",      type: "oauth" },
  { id: "linkedin",   name: "LinkedIn",         icon: "/icons/linkedin-icon.svg",                  type: "modal-linkedin" },
  { id: "youtube",    name: "YouTube",          icon: "/icons/youtube-color-icon.svg",             type: "oauth" },
  { id: "threads",    name: "Threads",          icon: "/icons/threads-icon.svg",                   type: "oauth" },
  { id: "mastodon",   name: "Mastodon",         icon: "/icons/mastodon-round-icon.svg",            type: "modal-mastodon" },
  { id: "bluesky",    name: "Bluesky",          icon: "/icons/bluesky-circle-color-icon.svg",      type: "modal-bluesky" },
  { id: "googleBusiness", name: "Google Business", icon: "/icons/google-icon.svg",               type: "coming-soon" },
];

export default function ConnectChannelsModal() {
  const { connectedAccounts, refreshAccounts } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);

  useEffect(() => {
    localStorage.removeItem("qp_channels_skipped");
    const skipped = sessionStorage.getItem(SESSION_KEY);
    if (skipped) return;

    const hasAnyConnected = Object.values(connectedAccounts).some((a) => a?.connected);
    if (!hasAnyConnected) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [connectedAccounts]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  };

  const getToken = () => localStorage.getItem("quickpost_token");

  const handleConnect = (platform) => {
    const { type, id } = platform;
    const token = getToken();

    if (type === "oauth-instagram") {
      setShowInstagramModal(true);
      return;
    }
    if (type === "oauth") {
      if (!token) return;
      window.location.href = `/api/auth/${id}?token=${token}`;
      return;
    }
    if (type === "modal-linkedin")  { setShowLinkedInModal(true);  return; }
    if (type === "modal-pinterest") { setShowPinterestModal(true); return; }
    if (type === "modal-mastodon")  { setShowMastodonModal(true);  return; }
    if (type === "modal-bluesky")   { setShowBlueskyModal(true);   return; }
    if (type === "coming-soon") {
      alert(`${platform.name} integration is coming soon!`);
    }
  };

  const unconnectedPlatforms = platforms.filter(
    (p) => !connectedAccounts[p.id]?.connected
  );

  if (!visible) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {visible && (
          <>
            {/* Backdrop + centering container */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismiss}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(20,20,19,0.55)",
                backdropFilter: "blur(6px)",
                zIndex: 9998,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                zIndex: 9999,
                width: "min(520px, 92vw)",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                borderRadius: 32,
                boxShadow: "0 36px 110px rgba(20,20,19,0.32), 0 10px 34px rgba(20,20,19,0.12)",
                overflow: "hidden",
              }}
            >
              {/* Header gradient strip */}
              <div style={{
                backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.32) 42%, rgba(0,0,0,0.48) 100%), linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.18)), url("/download (2).jpg")',
                backgroundSize: 'cover',
                backgroundPosition: '20% 50%',
                padding: "32px 28px 28px",
                position: "relative",
              }}>
                <button
                  onClick={dismiss}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(10px)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                >
                  <X size={16} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", textShadow: "0 1px 12px rgba(0,0,0,0.45)" }}>
                    Onboarding
                  </span>
                </div>

                <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>
                  Connect your social channels
                </h2>
                <p style={{ color: "rgba(255,255,255,0.96)", fontSize: 14, margin: "8px 0 0", lineHeight: 1.5, fontWeight: 650, maxWidth: 420, textShadow: "0 1px 14px rgba(0,0,0,0.48)" }}>
                  Post to all your networks from one place. Connect at least one channel to unlock your dashboard.
                </p>
              </div>

              {/* Platform grid */}
              <div style={{ padding: "24px 28px 12px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--slate)", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 16px" }}>
                  Choose platforms to connect
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  gap: 12,
                }}>
                  {unconnectedPlatforms.map((platform) => (
                    <PlatformTile
                      key={platform.id}
                      platform={platform}
                      onClick={() => handleConnect(platform)}
                    />
                  ))}
                  {unconnectedPlatforms.length === 0 && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "24px 0", background: "rgba(20,20,19,0.02)", borderRadius: 16 }}>
                      <p style={{ color: "var(--ink)", fontWeight: 600, fontSize: 14, margin: 0 }}>
                        All channels connected! 🎉
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: "16px 28px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <button
                  onClick={dismiss}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--slate)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "8px 0",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--ink)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--slate)"}
                >
                  Skip for now
                </button>
                <button
                  onClick={dismiss}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.64), rgba(0,0,0,0.26)), url("/download (2).jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: '20% 50%',
                    color: "#fff",
                    border: "none",
                    borderRadius: 14,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.24)",
                    textShadow: "0 1px 10px rgba(0,0,0,0.5)",
                    transition: "transform 0.2s, brightness 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; }}
                >
                  Go to Dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sub-modals */}
      {showInstagramModal && (
        <InstagramBusinessSetupModal
          onClose={() => setShowInstagramModal(false)}
          onProceed={() => {
            setShowInstagramModal(false);
            const token = getToken();
            if (token) window.location.href = `/api/auth/instagram?token=${token}`;
          }}
        />
      )}
      {showLinkedInModal && (
        <LinkedInConnectModal
          isOpen={showLinkedInModal}
          onClose={() => { setShowLinkedInModal(false); refreshAccounts(); }}
        />
      )}
      {showPinterestModal && (
        <PinterestConnectModal
          isOpen={showPinterestModal}
          onClose={() => { setShowPinterestModal(false); refreshAccounts(); }}
        />
      )}
      {showMastodonModal && (
        <MastodonConnectModal
          isOpen={showMastodonModal}
          onClose={() => { setShowMastodonModal(false); refreshAccounts(); }}
        />
      )}
      {showBlueskyModal && (
        <BlueskyConnectModal
          isOpen={showBlueskyModal}
          onClose={() => { setShowBlueskyModal(false); refreshAccounts(); }}
        />
      )}
    </>,
    document.body
  );
}

function PlatformTile({ platform, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Connect ${platform.name}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "16px 10px",
        borderRadius: 20,
        border: "none",
        background: hovered ? "rgba(243, 115, 56, 0.06)" : "rgba(255,255,255,0.92)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 14px 26px rgba(243, 115, 56, 0.14)" : "0 8px 24px rgba(20,20,19,0.06)",
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.3s ease",
        transform: hovered ? "scale(1.1)" : "none",
      }}>
        <img src={platform.icon} alt={platform.name} style={{ width: 32, height: 32, objectFit: "contain" }} />
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: hovered ? "var(--ink)" : "var(--slate)",
        textAlign: "center",
        lineHeight: 1.2,
        transition: "color 0.2s",
      }}>
        {platform.name}
      </span>
    </button>
  );
}
