/* ═══════════════════════════════════════════════════════════════════
   App.jsx — Full replacement with lazy loading + ErrorBoundary
   Replace: client/src/App.jsx
═══════════════════════════════════════════════════════════════════ */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { UploadJobProvider } from './context/UploadJobContext';
import ErrorBoundary from './components/ErrorBoundary';
import UploadManagerPanel from './components/UploadManagerPanel';
import ComplianceBanner from './components/ComplianceBanner';
import ContentProtection from './components/ContentProtection';
import { useAuth } from './context/AuthContext';

// ── Synchronous imports (auth-critical path) ──
import AuthPage from './components/AuthPage';
import AuthCallback from './components/AuthCallback';
import SSOPage from './pages/SSOPage';
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
const BillingPage    = lazy(() => import('./pages/BillingPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const AutoDMModuleLayout = lazy(() => import('./features/autodm/AutoDMModuleLayout'));
const AutomationsPage = lazy(() => import('./features/autodm/AutomationsPage'));
const AutomationEditorPage = lazy(() => import('./features/autodm/AutomationEditorPage'));
const ContactsPage = lazy(() => import('./features/autodm/ContactsPage'));
const ProductsPage = lazy(() => import('./features/autodm/ProductsPage'));
const OrdersPage = lazy(() => import('./features/autodm/OrdersPage'));
const SettingsPage = lazy(() => import('./features/autodm/SettingsPage'));
const LeadsDataPage = lazy(() => import('./features/autodm/LeadsDataPage'));
const AutoDMConnectPage = lazy(() => import('./features/autodm/ConnectInstagramPage'));
const AutoDMConnectSuccessPage = lazy(() => import('./features/autodm/ConnectSuccessPage'));
const AutoDMProvider = lazy(() => import('./features/autodm/AutoDMContext').then((module) => ({ default: module.AutoDMProvider })));

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
            : <AuthPage />
        }
      />

      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/social-sso"   element={<SSOPage />} />
      <Route
        path="/connect/success"
        element={
          isAuthenticated ? (
            <AutoDMProvider>
              <AutoDMConnectSuccessPage />
            </AutoDMProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
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
        <Route path="billing"  element={<BillingPage />} />
        <Route path="payment-success" element={<PaymentSuccessPage />} />
        <Route
          path="auto-dm"
          element={
            <AutoDMProvider>
              <AutoDMModuleLayout />
            </AutoDMProvider>
          }
        >
          <Route index element={<Navigate to="/dashboard/auto-dm/automations" replace />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="automations/new" element={<AutomationEditorPage />} />
          <Route path="automations/:id" element={<AutomationEditorPage />} />
          <Route path="automations/:id/leads" element={<LeadsDataPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="connect" element={<AutoDMConnectPage />} />
          <Route path="connect/success" element={<AutoDMConnectSuccessPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
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
              <Toaster position="top-right" />
              <UploadManagerPanel />
              <ComplianceBanner />
              <ContentProtection />
            </BrowserRouter>
          </UploadJobProvider>
        </DialogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
