/**
 * ErrorBoundary.jsx — Global error boundary for GAP Social-Pilot
 * Replace: client/src/components/ErrorBoundary.jsx  (new file)
 */

import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to your error tracking service:
    // Sentry.captureException(error, { extra: errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--canvas, #f3f0ee)',
            fontFamily: 'var(--font-body, "Sofia Sans", sans-serif)',
            padding: '24px',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: 400,
              width: '100%',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(220, 38, 38, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle
                size={28}
                style={{ color: '#dc2626' }}
                aria-hidden="true"
              />
            </div>

            {/* Heading */}
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--ink, #141413)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: 14,
                color: 'var(--slate, #696969)',
                margin: '0 0 28px',
                lineHeight: 1.55,
                fontWeight: 450,
              }}
            >
              An unexpected error occurred. Your data is safe — reload the
              page to continue.
            </p>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  marginBottom: 24,
                  textAlign: 'left',
                  padding: 12,
                  background: 'rgba(220,38,38,0.04)',
                  borderRadius: 10,
                  border: '1px solid rgba(220,38,38,0.12)',
                  fontSize: 11,
                  color: '#dc2626',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: 8 }}>
                  Error details (dev mode)
                </summary>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <pre
                    style={{
                      marginTop: 8,
                      whiteSpace: 'pre-wrap',
                      fontSize: 10,
                      opacity: 0.7,
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            {/* Reload button */}
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                background: 'var(--ink, #141413)',
                color: 'var(--canvas, #f3f0ee)',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-body, "Sofia Sans", sans-serif)',
                letterSpacing: '-0.01em',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = '#1e1e1c')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = 'var(--ink, #141413)')
              }
            >
              <RefreshCw size={15} aria-hidden="true" />
              Reload Page
            </button>

            {/* Go home link */}
            <div style={{ marginTop: 16 }}>
              <a
                href="/"
                style={{
                  fontSize: 13,
                  color: 'var(--arc, #f37338)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                ← Back to home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/* ═══════════════════════════════════════════════════════════════════
   App.jsx — Full replacement with lazy loading + ErrorBoundary
   Replace: client/src/App.jsx
═══════════════════════════════════════════════════════════════════ */

/*
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { UploadJobProvider } from './context/UploadJobContext';
import ErrorBoundary from './components/ErrorBoundary';
import UploadManagerPanel from './components/UploadManagerPanel';
import CookieConsent from './components/CookieConsent';
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
            </BrowserRouter>
          </UploadJobProvider>
        </DialogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
*/
