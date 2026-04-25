/* ═══════════════════════════════════════════════════════════════════
   App.jsx — Full replacement with lazy loading + ErrorBoundary
   Replace: client/src/App.jsx
═══════════════════════════════════════════════════════════════════ */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { UploadJobProvider } from './context/UploadJobContext';
import ErrorBoundary from './components/ErrorBoundary';
import UploadManagerPanel from './components/UploadManagerPanel';
import CookieConsent from './components/CookieConsent';
import ContentProtection from './components/ContentProtection';
import { useAuth } from './context/AuthContext';

// ── Synchronous imports (auth-critical path) ──
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import DashboardLayout from './components/DashboardLayout';
import { NotFoundPage } from './components/ui/404-page-not-found';

// ── Lazy imports (loaded on demand) ──
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const PricingPage    = lazy(() => import('./pages/PricingPage'));
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Dashboard      = lazy(() => import('./components/Dashboard'));
const BroadcastForm  = lazy(() => import('./components/BroadcastForm'));
const History        = lazy(() => import('./pages/History'));
const ScheduledQueue = lazy(() => import('./pages/ScheduledQueue'));
const AllTrendsPage  = lazy(() => import('./pages/trends/AllTrendsPage'));
const Onboarding     = lazy(() => import('./components/Onboarding'));

// ── Page loader ──
const PageLoader = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--canvas)',
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: '2px solid rgba(20,20,19,0.08)',
        borderTopColor: 'var(--arc)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
);

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      // Public
      <Route path="/"        element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms"   element={<TermsOfService />} />

      <Route
        path="/login"
        element={
          isAuthenticated
            ? localStorage.getItem('qp_onboarding_done')
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/onboarding" replace />
            : <Login />
        }
      />

      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/onboarding"
        element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />}
      />

      // Protected dashboard
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index           element={<Dashboard />} />
        <Route path="compose"  element={<BroadcastForm />} />
        <Route path="history"  element={<History />} />
        <Route path="queue"    element={<ScheduledQueue />} />
        <Route path="trends"   element={<AllTrendsPage />} />
      </Route>

      // 404
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DialogProvider>
          <UploadJobProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <AppContent />
              </Suspense>
              <UploadManagerPanel />
              <CookieConsent />
              <ContentProtection />
            </BrowserRouter>
          </UploadJobProvider>
        </DialogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
