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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--canvas)', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,20,19,0.4)',
            zIndex: 49, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: isDesktop || sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        width: 240,
        boxShadow: !isDesktop && sidebarOpen ? '20px 0 60px rgba(0,0,0,0.1)' : 'none',
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
        transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        height: '100vh',
      }}>
        {/* Header — passes mobile toggle */}
        <Header onMenuClick={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} isDesktop={isDesktop} />

        {/* Page content below header */}
        <main style={{ 
          flex: 1, 
          marginTop: 56, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: isDesktop ? '24px' : '16px',
          WebkitOverflowScrolling: 'touch'
        }}>
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
