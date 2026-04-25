import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import ConnectChannelsModal from "./ConnectChannelsModal";

const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const location = useLocation();
  const isTrendsPage = location.pathname.includes('/dashboard/trends');

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false); // auto-close mobile drawer on desktop
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Wait for Supabase to restore session before deciding ──
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--canvas, #f5f0eb)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(20,20,19,0.08)",
            borderTopColor: "var(--r-hero, #5b47e0)",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--canvas)",
        overflow: "hidden",
      }}
    >
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: -40,
          left: 16,
          zIndex: 9999,
          padding: '8px 16px',
          background: 'var(--ink)',
          color: 'var(--canvas)',
          borderRadius: '0 0 8px 8px',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'top 0.2s',
        }}
        onFocus={e => e.currentTarget.style.top = '0'}
        onBlur={e => e.currentTarget.style.top = '-40px'}
      >
        Skip to main content
      </a>
      {/* Mobile overlay */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,20,19,0.4)",
            zIndex: 49,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Sidebar — hidden on Trends page, fixed on desktop, drawer on mobile */}
      {!isTrendsPage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 50,
            transform:
              isDesktop || sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: 240,
            boxShadow:
              !isDesktop && sidebarOpen ? "20px 0 60px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          marginLeft: isDesktop && !isTrendsPage ? 240 : 0,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          transition: "margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          height: "100vh",
        }}
      >
        {/* Header — passes mobile toggle */}
        <Header
          onMenuClick={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
          isDesktop={isDesktop}
          isTrendsPage={isTrendsPage}
        />

        {/* Page content below header */}
        <main
          id="main-content"
          className="custom-scrollbar"
          style={{
            flex: 1,
            marginTop: 56,
            overflowY: "auto",
            overflowX: "hidden",
            padding: 0,
            WebkitOverflowScrolling: "touch",
          }}
        >
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
          <ConnectChannelsModal />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
