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
  const [imgError, setImgError] = useState(false);

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
            className="group flex items-center justify-start w-[36px] hover:w-[100px] h-[36px] border-none rounded-full hover:rounded-[18px] cursor-pointer relative overflow-hidden transition-all duration-300 shadow-[1px_1px_5px_rgba(0,0,0,0.08)] bg-[#ff4141] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <div className="flex items-center justify-center w-full group-hover:w-[35%] transition-all duration-300 group-hover:pl-4">
              <svg viewBox="0 0 512 512" className="w-[16px] fill-white">
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
              </svg>
            </div>
            <div className="absolute right-0 w-0 group-hover:w-[65%] opacity-0 group-hover:opacity-100 text-white text-[11px] font-semibold transition-all duration-300 group-hover:pr-3 whitespace-nowrap">
              Logout
            </div>
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
