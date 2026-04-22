import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { UploadJobProvider } from './context/UploadJobContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import Dashboard from './components/Dashboard';
import BroadcastForm from './components/BroadcastForm';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import History from './pages/History';
import Onboarding from './components/Onboarding';
import ScheduledQueue from './pages/ScheduledQueue';
import { useAuth } from './context/AuthContext';
import UploadManagerPanel from './components/UploadManagerPanel';
import CookieConsent from './components/CookieConsent';

import DashboardLayout from './components/DashboardLayout';
import { NotFoundPage } from './components/ui/404-page-not-found';
function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      
      <Route path="/login" element={
        isAuthenticated
          ? (localStorage.getItem('qp_onboarding_done') ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />)
          : <Login />
      } />
      
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />} />

      {/* Protected Dashboard Routes with Persistent Layout */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Child routes that will render inside the Layout's Outlet */}
        <Route index element={<Dashboard />} />
        <Route path="compose" element={<BroadcastForm />} />
        <Route path="history" element={<History />} />
        <Route path="queue" element={<ScheduledQueue />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <UploadJobProvider>
          <BrowserRouter>
            <AppContent />
            <UploadManagerPanel />
            <CookieConsent />
          </BrowserRouter>
        </UploadJobProvider>
      </DialogProvider>
    </AuthProvider>
  );
}

export default App;
