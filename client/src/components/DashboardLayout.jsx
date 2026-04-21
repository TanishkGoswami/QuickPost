import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const DashboardLayout = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(false); // auto-close mobile drawer on desktop
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--canvas)' }}>
      {/* Mobile overlay */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 40, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: isDesktop || sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        width: 240,
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: isDesktop ? 240 : 0,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header — passes mobile toggle */}
        <Header onMenuClick={() => setSidebarOpen(o => !o)} />

        {/* Page content below header */}
        <main style={{ flex: 1, marginTop: 64, overflowY: 'auto' }}>
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
