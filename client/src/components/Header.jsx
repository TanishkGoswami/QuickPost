import React, { useState } from "react";
import { Menu, ArrowLeft, Settings, LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import apiClient from "../utils/apiClient";

function Header({ onMenuClick, sidebarOpen, isDesktop, isTrendsPage }) {
  const { user, logout, connectedAccounts, refreshAccounts } = useAuth();
  const { confirm, alert } = useDialog();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState(null);

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

  const handleDisconnect = async (platform) => {
    const confirmed = await confirm(
      "Disconnect Account",
      `Are you sure you want to disconnect your ${platform} account?`,
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
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: isDesktop && !isTrendsPage ? 240 : 0,
        zIndex: 39,
        height: 56,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(20,20,19,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isDesktop ? "0 24px" : "0 16px",
        fontFamily: "var(--font)",
        transition: "left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Back Button on Trends Page */}
        {isTrendsPage && (
          <button
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
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
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
            <Settings size={18} />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
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
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.05)"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--slate)"; }}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* User pill */}
        <div
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
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
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
                {Object.entries(connectedAccounts || {}).filter(([_, data]) => data?.connected).map(([id, data]) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--r-btn)", background: "var(--canvas)", border: "1px solid rgba(20,20,19,0.08)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0, textTransform: 'capitalize' }}>{id}</p>
                      <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0 }}>{data.username || 'Connected'}</p>
                    </div>
                    <button
                      onClick={() => handleDisconnect(id)}
                      disabled={disconnectingPlatform === id}
                      style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: "var(--r-btn)", border: "1px solid #dc2626", color: "#dc2626", background: "none", cursor: "pointer" }}
                    >
                      {disconnectingPlatform === id ? "..." : "Disconnect"}
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
