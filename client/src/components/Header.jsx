import React from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Header({ onMenuClick, sidebarOpen, isDesktop, isTrendsPage }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

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
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-1px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Mobile menu toggle (hide on trends page since sidebar is hidden) */}
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-1px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      {/* Right: user pill */}
      <div style={{ marginLeft: "auto" }}>
        <div
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
    </header>
  );
}

export default Header;
