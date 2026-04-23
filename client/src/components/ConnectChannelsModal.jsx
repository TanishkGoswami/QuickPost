import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BlueskyConnectModal from "./BlueskyConnectModal";
import PinterestConnectModal from "./PinterestConnectModal";
import LinkedInConnectModal from "./LinkedInConnectModal";
import MastodonConnectModal from "./MastodonConnectModal";
import TikTokConnectModal from "./TikTokConnectModal";
import InstagramBusinessSetupModal from "./InstagramBusinessSetupModal";

const SESSION_KEY = "qp_channels_skipped";

const platforms = [
  { id: "instagram",  name: "Instagram",       icon: "/icons/ig-instagram-icon.svg",              type: "oauth-instagram" },
  { id: "facebook",   name: "Facebook",         icon: "/icons/facebook-round-color-icon.svg",      type: "oauth" },
  { id: "x",          name: "X",                icon: "/icons/x-social-media-round-icon.svg",      type: "oauth" },
  { id: "linkedin",   name: "LinkedIn",         icon: "/icons/linkedin-icon.svg",                  type: "modal-linkedin" },
  { id: "tiktok",     name: "TikTok",           icon: "/icons/tiktok-circle-icon.svg",             type: "modal-tiktok" },
  { id: "youtube",    name: "YouTube",          icon: "/icons/youtube-color-icon.svg",             type: "oauth" },
  { id: "pinterest",  name: "Pinterest",        icon: "/icons/pinterest-round-color-icon.svg",     type: "modal-pinterest" },
  { id: "threads",    name: "Threads",          icon: "/icons/threads-icon.svg",                   type: "oauth" },
  { id: "mastodon",   name: "Mastodon",         icon: "/icons/mastodon-round-icon.svg",            type: "modal-mastodon" },
  { id: "bluesky",    name: "Bluesky",          icon: "/icons/bluesky-circle-color-icon.svg",      type: "modal-bluesky" },
  { id: "google-business", name: "Google Business", icon: "/icons/google-icon.svg",               type: "coming-soon" },
];

export default function ConnectChannelsModal() {
  const { connectedAccounts, refreshAccounts } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);

  useEffect(() => {
    localStorage.removeItem("qp_channels_skipped");
    const skipped = sessionStorage.getItem(SESSION_KEY);
    if (skipped) return;

    const hasAnyConnected = Object.values(connectedAccounts).some(Boolean);
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
    if (type === "modal-tiktok")    { setShowTikTokModal(true);    return; }
    if (type === "modal-pinterest") { setShowPinterestModal(true); return; }
    if (type === "modal-mastodon")  { setShowMastodonModal(true);  return; }
    if (type === "modal-bluesky")   { setShowBlueskyModal(true);   return; }
    if (type === "coming-soon") {
      alert("Google Business Profile integration is coming soon!");
    }
  };

  const unconnectedPlatforms = platforms.filter(
    (p) => !connectedAccounts[p.id]
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
                background: "#fff",
                borderRadius: 20,
                boxShadow: "0 24px 80px rgba(20,20,19,0.18), 0 4px 16px rgba(20,20,19,0.08)",
                overflow: "hidden",
              }}
            >
              {/* Header gradient strip */}
              <div style={{
                background: "linear-gradient(135deg, #5b47e0 0%, #8b5cf6 50%, #ec4899 100%)",
                padding: "28px 28px 24px",
                position: "relative",
              }}>
                <button
                  onClick={dismiss}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <X size={15} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Zap size={18} color="#fff" fill="#fff" />
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                    Get Started
                  </span>
                </div>

                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                  Connect your social channels
                </h2>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: "6px 0 0", lineHeight: 1.5 }}>
                  Post to all your networks from one place. Connect at least one channel to get started.
                </p>
              </div>

              {/* Platform grid */}
              <div style={{ padding: "20px 28px 8px" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,20,19,0.45)", letterSpacing: 0.6, textTransform: "uppercase", margin: "0 0 14px" }}>
                  Choose platforms to connect
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                  gap: 10,
                }}>
                  {unconnectedPlatforms.map((platform) => (
                    <PlatformTile
                      key={platform.id}
                      platform={platform}
                      onClick={() => handleConnect(platform)}
                    />
                  ))}
                  {unconnectedPlatforms.length === 0 && (
                    <p style={{ gridColumn: "1/-1", textAlign: "center", color: "rgba(20,20,19,0.5)", fontSize: 14, padding: "12px 0" }}>
                      All channels connected!
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: "16px 28px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <button
                  onClick={dismiss}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(20,20,19,0.45)",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  Skip for now
                </button>
                <button
                  onClick={dismiss}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#141413",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Go to Dashboard
                  <ArrowRight size={14} />
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
      {showTikTokModal && (
        <TikTokConnectModal
          isOpen={showTikTokModal}
          onClose={() => { setShowTikTokModal(false); refreshAccounts(); }}
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
        gap: 6,
        padding: "12px 8px",
        borderRadius: 12,
        border: hovered ? "1.5px solid rgba(91,71,224,0.4)" : "1.5px solid rgba(20,20,19,0.08)",
        background: hovered ? "rgba(91,71,224,0.05)" : "#fff",
        cursor: "pointer",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 4px 12px rgba(91,71,224,0.12)" : "none",
      }}
    >
      <img src={platform.icon} alt={platform.name} style={{ width: 28, height: 28 }} />
      <span style={{
        fontSize: 10,
        fontWeight: 500,
        color: "rgba(20,20,19,0.6)",
        textAlign: "center",
        lineHeight: 1.2,
      }}>
        {platform.name}
      </span>
    </button>
  );
}
