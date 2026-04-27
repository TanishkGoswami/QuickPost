import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  CalendarClock,
  Plus,
  Share2,
  ChevronDown,
  X,
  Flame,
  Sparkles,
  Lock,
} from "lucide-react";
import { useDialog } from "../context/DialogContext";
import logo from "/logo.png";
import InstagramBusinessSetupModal from "./InstagramBusinessSetupModal";
import BlueskyConnectModal from "./BlueskyConnectModal";
import PinterestConnectModal from "./PinterestConnectModal";
import LinkedInConnectModal from "./LinkedInConnectModal";
import MastodonConnectModal from "./MastodonConnectModal";
import apiClient from "../utils/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/* ── tiny SVG orbital arc decoration ── */
const OrbitalArc = () => (
  <svg
    className="orbital-arc"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      overflow: "visible",
    }}
    aria-hidden="true"
  >
    <path d="M 20 60 Q 120 20 220 80" />
  </svg>
);

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedDashboardPlatform =
    location.pathname === "/dashboard"
      ? new URLSearchParams(location.search).get("platform")
      : null;

  const { user, connectedAccounts, refreshAccounts, logout } = useAuth();
  const { confirm, alert } = useDialog();
  const [showBusinessSetupModal, setShowBusinessSetupModal] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [connectedOpen, setConnectedOpen] = useState(true);
  const [imgError, setImgError] = useState(false);

  const handleConnectInstagram = () => setShowBusinessSetupModal(true);
  const handleProceedToConnect = () => {
    setShowBusinessSetupModal(false);
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      alert("Error", "Authentication token missing. Please log in again.", {
        intent: "danger",
      });
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${apiUrl}/api/auth/instagram?token=${token}`;
  };
  const handleConnectFacebook = () => {
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      alert("Error", "Authentication token missing. Please log in again.", {
        intent: "danger",
      });
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${apiUrl}/api/auth/facebook?token=${token}`;
  };
  const handleConnectThreads = () => {
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      alert("Error", "Authentication token missing. Please log in again.", {
        intent: "danger",
      });
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${apiUrl}/api/auth/threads?token=${token}`;
  };
  const handleConnectX = () => {
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      alert("Error", "Authentication token missing. Please log in again.", {
        intent: "danger",
      });
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    setConnectingPlatform("x");
    window.location.href = `${apiUrl}/api/auth/x?token=${token}`;
  };
  const handleConnectReddit = () => {
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      alert("Error", "Authentication token missing. Please log in again.", {
        intent: "danger",
      });
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    setConnectingPlatform("reddit");
    window.location.href = `${apiUrl}/api/auth/reddit?token=${token}`;
  };
  const handleConnectYouTube = () => {
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      alert("Error", "Authentication token missing. Please log in again.", {
        intent: "danger",
      });
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${apiUrl}/api/auth/youtube?token=${token}`;
  };
  const handleDisconnect = async (platform) => {
    const confirmed = await confirm(
      "Disconnect Account",
      `Are you sure you want to disconnect your ${platform} account? This will stop all scheduled posts to this channel.`,
      {
        intent: "danger",
        confirmText: "Disconnect",
        cancelText: "Keep Connected",
      },
    );
    if (!confirmed) return;
    setDisconnectingPlatform(platform);
    try {
      const response = await apiClient.delete(`/api/auth/disconnect/${platform}`);
      const data = response.data;
      if (data.success) {
        await refreshAccounts();
        alert("Success", `Successfully disconnected from ${platform}`, {
          intent: "primary",
        });
      } else {
        alert("Error", `Failed to disconnect: ${data.error}`, {
          intent: "danger",
        });
      }
    } catch (error) {
      alert("Error", "Failed to disconnect account. Please try again.", {
        intent: "danger",
      });
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const platforms = [
    {
      id: "facebook",
      name: "Facebook",
      connected: connectedAccounts.facebook?.connected,
      icon: (
        <img
          src="/icons/facebook-round-color-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: handleConnectFacebook,
    },
    {
      id: "instagram",
      name: "Instagram",
      connected: connectedAccounts.instagram?.connected,
      icon: (
        <img
          src="/icons/ig-instagram-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: handleConnectInstagram,
    },
    {
      id: "x",
      name: "X",
      connected: connectedAccounts.x?.connected,
      icon: (
        <img
          src="/icons/x-social-media-round-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () =>
        alert("Coming Soon", "X integration coming soon!", {
          intent: "warning",
        }),
      disabled: true,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      connected: connectedAccounts.linkedin?.connected,
      icon: (
        <img
          src="/icons/linkedin-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () => setShowLinkedInModal(true),
    },
    {
      id: "youtube",
      name: "YouTube",
      connected: connectedAccounts.youtube?.connected,
      icon: (
        <img
          src="/icons/youtube-color-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: handleConnectYouTube,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      connected: connectedAccounts.pinterest?.connected,
      icon: (
        <img
          src="/icons/pinterest-round-color-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () =>
        alert("Coming Soon", "Pinterest integration coming soon!", {
          intent: "warning",
        }),
      disabled: true,
    },
    {
      id: "threads",
      name: "Threads",
      connected: connectedAccounts.threads?.connected,
      icon: (
        <img
          src="/icons/threads-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: handleConnectThreads,
    },
    {
      id: "mastodon",
      name: "Mastodon",
      connected: connectedAccounts.mastodon?.connected,
      icon: (
        <img
          src="/icons/mastodon-round-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () => setShowMastodonModal(true),
    },
    {
      id: "bluesky",
      name: "Bluesky",
      connected: connectedAccounts.bluesky?.connected,
      icon: (
        <img
          src="/icons/bluesky-circle-color-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () => setShowBlueskyModal(true),
    },
    {
      id: "googleBusiness",
      name: "Google Business",
      connected: connectedAccounts.googleBusiness?.connected,
      icon: (
        <img
          src="/icons/google-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () =>
        alert(
          "Coming Soon",
          "Google Business Profile integration coming soon!",
          { intent: "warning" },
        ),
    },
    {
      id: "reddit",
      name: "Reddit",
      connected: connectedAccounts.reddit?.connected,
      icon: (
        <img
          src="/icons/reddit-icon.svg"
          style={{ width: 20, height: 20 }}
          alt=""
        />
      ),
      onConnect: () =>
        alert("Coming Soon", "Reddit integration coming soon!", {
          intent: "warning",
        }),
      disabled: true,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="flex flex-col custom-scrollbar"
      style={{
        width: 240,
        height: "100%",
        background: "var(--canvas)",
        borderRight: "1px solid rgba(20,20,19,0.06)",
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid rgba(20,20,19,0.08)",
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-3"
          style={{ textDecoration: "none" }}
        >
          <img
            src={logo}
            alt="GAP Social-pilot"
            style={{ height: 36, width: 36, objectFit: "contain" }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--ink)",
              fontFamily: "var(--font-logo)",
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--arc)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>GAP</span>
            <span>Social‑pilot</span>
          </span>
        </Link>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ padding: "12px 12px 0" }}
      >
        {/* ── Primary nav ── */}
        <div style={{ marginBottom: 20 }}>
          {[
            {
              to: "/dashboard",
              label: "All Channels",
              icon: <Share2 size={16} />,
            },
            {
              to: "/dashboard/queue",
              label: "Scheduled Queue",
              icon: <CalendarClock size={16} />,
            },
            {
              to: "/dashboard/trends",
              label: "All Trends",
              icon: <Flame size={16} />,
            },
          ].map(({ to, label, icon }) => {
            const active = isActive(to);
            const isLocked = user?.plan === 'Free' || !user?.plan;

            const content = (
              <>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--r-sm)",
                    background: active
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(20,20,19,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {isLocked && <Lock size={14} style={{ opacity: 0.5 }} />}
              </>
            );

            const style = {
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: "var(--r-btn)",
              marginBottom: 2,
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--canvas)" : (isLocked ? "var(--dust)" : "var(--slate)"),
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: isLocked ? 0.6 : 1,
              cursor: isLocked ? "not-allowed" : "pointer"
            };

            if (isLocked) {
              return (
                <div key={to} style={style} onClick={() => alert("Please upgrade your plan to access this feature.")}>
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={to}
                to={to}
                style={style}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(20,20,19,0.05)";
                    e.currentTarget.style.color = "var(--ink)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--slate)";
                  }
                }}
              >
                {content}
              </Link>
            );
          })}
        </div>

        {/* ── Connected platforms ── */}
        <div style={{ marginTop: 8 }}>
          {(() => {
            const connectedPlatforms = platforms.filter((p) => p.connected);
            const visibleIcons = connectedPlatforms.slice(0, 3);
            const extraCount = Math.max(0, connectedPlatforms.length - 3);

            return (
              <button
                onClick={() => {
                  if (user?.plan === 'Free' || !user?.plan) {
                    alert("Please upgrade to Pro to manage your social channels.");
                    return;
                  }
                  setConnectedOpen(!connectedOpen);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "100px",
                  background: "var(--canvas-lifted)",
                  border: "1px solid rgba(20,20,19,0.08)",
                  cursor: "pointer",
                  marginBottom: 8,
                  transition: "all 0.2s",
                }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {!connectedOpen && (
                    <motion.div
                      key="icons"
                      initial={{ opacity: 0, width: 0, scale: 0.8 }}
                      animate={{ opacity: 1, width: "auto", scale: 1 }}
                      exit={{ opacity: 0, width: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {visibleIcons.map((p, i) => (
                        <div
                          key={p.id}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--white)",
                            border: "1.5px solid var(--canvas-lifted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: i === 0 ? 0 : -8,
                            zIndex: 3 - i,
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          {React.cloneElement(p.icon, {
                            style: { width: 14, height: 14 },
                          })}
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--canvas)",
                            border: "1.5px solid var(--canvas-lifted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: -8,
                            zIndex: 0,
                            fontSize: 9,
                            fontWeight: 700,
                            color: "var(--slate)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          +{extraCount}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.span
                  animate={{ marginLeft: connectedOpen ? 6 : 8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}
                >
                  Connected
                </motion.span>
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {connectedPlatforms.length > 0 && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#6366f1",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {connectedPlatforms.length}
                    </div>
                  )}
                  <ChevronDown
                    size={14}
                    style={{
                      color: "var(--slate)",
                      transform: connectedOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </button>
            );
          })()}

          <AnimatePresence>
            {connectedOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  overflow: "hidden",
                }}
              >
                {platforms
                  .filter((p) => p.connected)
                  .map((platform) => {
                    const isSelected =
                      selectedDashboardPlatform === platform.id &&
                      location.pathname === "/dashboard";
                    return (
                      <div
                        key={platform.id}
                        onClick={() =>
                          navigate(`/dashboard?platform=${platform.id}`)
                        }
                        className="group"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: "var(--r-btn)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: isSelected
                            ? "rgba(20,20,19,0.07)"
                            : "transparent",
                        }}
                      >
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "var(--r-sm)",
                              background: "var(--canvas-lifted)",
                              border: "1px solid rgba(20,20,19,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {platform.icon}
                          </div>
                          <span
                            style={{
                              position: "absolute",
                              bottom: -1,
                              right: -1,
                              width: 8,
                              height: 8,
                              background: "#22c55e",
                              borderRadius: "50%",
                              border: "1.5px solid var(--canvas)",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--ink)",
                              lineHeight: 1.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {connectedAccounts[platform.id]?.username || platform.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--slate)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Active
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Add Channels ── */}
        <div style={{ marginTop: 24, padding: "0 4px" }}>
          <div
            className="eyebrow"
            style={{ padding: "0 6px", marginBottom: 12 }}
          >
            Connect Channels
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {platforms
              .filter((p) => !p.connected)
              .map((platform) => (
                <button
                  key={platform.id}
                  onClick={platform.onConnect}
                  title={`Connect ${platform.name}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--r-btn)",
                    background: "var(--canvas-lifted)",
                    border: "1px dashed rgba(20,20,19,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: platform.disabled ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--ink)";
                    e.currentTarget.style.background = "var(--white)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(20,20,19,0.2)";
                    e.currentTarget.style.background = "var(--canvas-lifted)";
                  }}
                >
                  <div
                    style={{
                      transition: "all 0.2s",
                      transform: "scale(1)",
                      filter: "none",
                      opacity: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {platform.icon}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "12px 12px 16px",
          borderTop: "1px solid rgba(20,20,19,0.08)",
          background: "var(--canvas)",
        }}
      >
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--r-btn)",
              background: "var(--canvas-lifted)",
              border: "1px solid rgba(20,20,19,0.08)",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: (user.picture && !imgError) ? "transparent" : "var(--ink)",
                color: "var(--canvas)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                overflow: "hidden",
                border: (user.picture && !imgError) ? "1px solid rgba(20,20,19,0.08)" : "none"
              }}
            >
              {user.picture && !imgError ? (
                <img 
                  src={user.picture} 
                  alt="" 
                  onError={() => setImgError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              ) : (
                (user.name || user.email || "U")[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {user.name || "My Account"}
                </span>
                {user.plan && (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      padding: "2px 5px",
                      borderRadius: 4,
                      background: user.plan === "Free" ? "var(--dust)" : "var(--arc)",
                      color: user.plan === "Free" ? "var(--slate)" : "white",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {user.plan}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--slate)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}

        {/* ── Upgrade Button ── */}
        {(user?.plan === 'Free' || !user?.plan) && (
          <button
            onClick={() => navigate('/dashboard/billing')}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--r-btn)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--arc) 0%, #ff8c42 100%)',
              color: 'var(--white)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 8,
              boxShadow: '0 4px 12px rgba(243,115,56,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} />
            Upgrade to Pro
          </button>
        )}
        {user?.plan === 'Pro' && (
          <button
            onClick={() => navigate('/dashboard/billing')}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--r-btn)',
              border: 'none',
              background: 'linear-gradient(135deg, #5b47e0 0%, #8a77f5 100%)',
              color: 'var(--white)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 8,
              boxShadow: '0 4px 12px rgba(91,71,224,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} />
            Upgrade to Enterprise
          </button>
        )}
      </div>

      {/* ── Connection Modals ── */}
      {createPortal(
        <>
          <InstagramBusinessSetupModal
            isOpen={showBusinessSetupModal}
            onClose={() => setShowBusinessSetupModal(false)}
            onProceed={handleProceedToConnect}
          />
          <BlueskyConnectModal
            isOpen={showBlueskyModal}
            onClose={() => setShowBlueskyModal(false)}
            onSuccess={refreshAccounts}
          />
          <PinterestConnectModal
            isOpen={showPinterestModal}
            onClose={() => setShowPinterestModal(false)}
            onSuccess={refreshAccounts}
          />
          <LinkedInConnectModal
            isOpen={showLinkedInModal}
            onClose={() => setShowLinkedInModal(false)}
            onSuccess={refreshAccounts}
          />
          <MastodonConnectModal
            isOpen={showMastodonModal}
            onClose={() => setShowMastodonModal(false)}
            onSuccess={refreshAccounts}
          />

        </>,
        document.body,
      )}
    </aside>
  );
}

export default Sidebar;
