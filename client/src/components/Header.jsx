import React, { useState } from "react";
import { Menu, ArrowLeft, Unplug, LogOut, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import apiClient from "../utils/apiClient";

const PLATFORM_ICONS = {
  instagram: "/icons/ig-instagram-icon.svg",
  facebook: "/icons/facebook-round-color-icon.svg",
  youtube: "/icons/youtube-color-icon.svg",
  linkedin: "/icons/linkedin-icon.svg",
  threads: "/icons/threads-icon.svg",
  mastodon: "/icons/mastodon-round-icon.svg",
  bluesky: "/icons/bluesky-circle-color-icon.svg",
  reddit: "/icons/reddit-icon.svg",
  x: "/icons/x-social-media-round-icon.svg",
  pinterest: "/icons/pinterest-round-color-icon.svg",
  googleBusiness: "/icons/google-icon.svg",
};

function Header({ onMenuClick, sidebarOpen, isDesktop, isTrendsPage }) {
  const { user, logout, connectedAccounts, refreshAccounts } = useAuth();
  const { confirm, alert } = useDialog();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState(null);
  const [imgError, setImgError] = useState(false);

  const isEditorPage = location.pathname.includes('/dashboard/auto-dm/automations/') && location.pathname !== '/dashboard/auto-dm/automations';

  if (!user) return null;

  const handleLogout = async () => {
    const confirmed = await confirm(
      "Logout",
      "Are you sure you want to log out?",
      {
        intent: "logout",
        confirmText: "Logout",
        cancelText: "Stay logged in",
      },
    );
    if (confirmed) {
      logout();
      navigate("/login");
    }
  };

  const multiAccountProviders = [
    "facebook",
    "youtube",
    "linkedin",
    "threads",
    "mastodon",
    "bluesky",
    "reddit",
    "x",
    "pinterest",
    "googleBusiness",
  ];
  const connectedRows = [
    ...(connectedAccounts.instagramAccounts || []).map((account) => ({
      id: `instagram:${account.id}`,
      provider: "instagram",
      accountId: account.id,
      label: "Instagram",
      username: account.username,
      profilePicture: account.profilePicture,
    })),
    ...multiAccountProviders.flatMap((provider) =>
      (connectedAccounts?.[`${provider}Accounts`] || []).map((account) => ({
        id: `${provider}:${account.id}`,
        provider,
        accountId: account.id,
        label: provider,
        username: account.username,
        profilePicture: account.profilePicture,
      })),
    ),
    ...Object.entries(connectedAccounts || {})
      .filter(([id, data]) =>
        id !== "instagram" &&
        id !== "instagramAccounts" &&
        !id.endsWith("Accounts") &&
        !multiAccountProviders.includes(id) &&
        data?.connected
      )
      .map(([id, data]) => ({
        id,
        provider: id,
        accountId: null,
        label: id,
        username: data.username,
        profilePicture: data.profilePicture,
      })),
  ];

  const handleDisconnect = async (platform, accountId = null) => {
    const message = platform === "instagram"
      ? `Are you sure you want to disconnect your ${platform} account? This will pause any active automations. Your automations will be restored when you reconnect.`
      : `Are you sure you want to disconnect your ${platform} account?`;
    const confirmed = await confirm(
      "Disconnect Account",
      message,
      {
        intent: "danger",
        confirmText: "Disconnect",
        cancelText: "Keep Connected",
      },
    );
    if (!confirmed) return;
    const busyKey = accountId || platform;
    setDisconnectingPlatform(busyKey);
    try {
      const response = await apiClient.delete(
        `/api/auth/disconnect/${platform}${accountId ? `?accountId=${accountId}` : ""}`,
      );
      if (response.data.success) {
        await refreshAccounts();
        alert("Success", `Disconnected from ${platform}`, { intent: "primary" });
      }
    } catch (error) {
      alert("Error", "Failed to disconnect account.", { intent: "danger" });
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const handleSettingsClick = () => {
    if (location.pathname.startsWith("/dashboard/auto-dm")) {
      navigate("/dashboard/auto-dm/settings");
      return;
    }
    setShowSettings(true);
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <header
      className="qp-header"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: isDesktop && !isTrendsPage ? 240 : 0,
        zIndex: 39,
        height: 56,
        background: "rgba(245, 241, 236, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #d3cec6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isDesktop ? "0 24px" : "0 16px",
        fontFamily: "var(--font-body)",
        transition: "left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div id="header-left-portal"></div>
        {/* Back Button on Trends Page */}
        {isTrendsPage && (
          <button
            className="qp-header-icon-button"
            onClick={() => navigate('/dashboard')}
            aria-label="Go Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-btn)",
              border: "1px solid rgba(20,20,19,0.08)",
              background: "var(--white)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink)",
              transition: "all 0.2s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Mobile menu toggle */}
        {!isDesktop && !isTrendsPage && (
          <button
            className="qp-header-icon-button"
            onClick={onMenuClick}
            aria-label="Toggle Menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-btn)",
              border: "1px solid rgba(20,20,19,0.08)",
              background: "var(--white)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink)",
              transition: "all 0.2s",
            }}
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      {/* Right: Actions + user pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div id="header-actions-portal" style={{ display: "flex", alignItems: "center", gap: 12 }}></div>
        {!isEditorPage && (
          <>
            <div style={{ display: "flex", gap: 6 }}>
          <button
            className="qp-header-icon-button"
            onClick={handleSettingsClick}
            title="Connections"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--slate)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(20,20,19,0.05)"; e.currentTarget.style.color = "var(--ink)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--slate)"; }}
          >
            <Unplug size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 h-9 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-semibold rounded-lg transition-all duration-200 border border-red-200 hover:border-red-500 shadow-sm"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={16} strokeWidth={2.5} />
            <span className="text-[13px] tracking-wide">Logout</span>
          </button>
        </div>

        {/* User pill */}
        <div
          className="qp-header-user-pill"
          aria-label={`Account: ${user.name || user.email}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px 4px 4px",
            borderRadius: "var(--r-pill)",
            background: "var(--canvas)",
            border: "1px solid rgba(20,20,19,0.08)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {user.picture && !imgError ? (
            <img
              src={user.picture}
              alt={user.name}
              onError={() => setImgError(true)}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1.5px solid var(--white)",
              }}
            />
          ) : (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--ink)",
                color: "var(--canvas)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink)",
              maxWidth: isDesktop ? 120 : 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {user.name || "Account"}
          </span>
        </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && createPortal(
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(20,20,19,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 20, fontWeight: 500 }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "24px 32px" }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Connected Accounts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {connectedRows.map((row) => (
                  <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--r-btn)", background: "var(--canvas)", border: "1px solid rgba(20,20,19,0.08)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--white)", border: "1px solid rgba(20,20,19,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {row.profilePicture ? (
                        <img
                          src={row.profilePicture}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : PLATFORM_ICONS[row.provider] ? (
                        <img
                          src={PLATFORM_ICONS[row.provider]}
                          alt={`${row.provider} logo`}
                          style={{ width: 22, height: 22, objectFit: "contain" }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--slate)", textTransform: "uppercase" }}>
                          {row.label.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0, textTransform: 'capitalize' }}>{row.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0 }}>{row.username ? `@${row.username}` : 'Connected'}</p>
                    </div>
                    <button
                      onClick={() => handleDisconnect(row.provider, row.accountId)}
                      disabled={disconnectingPlatform === (row.accountId || row.provider)}
                      style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: "var(--r-btn)", border: "1px solid #dc2626", color: "#dc2626", background: "none", cursor: "pointer" }}
                    >
                      {disconnectingPlatform === (row.accountId || row.provider) ? "..." : "Disconnect"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

export default Header;
