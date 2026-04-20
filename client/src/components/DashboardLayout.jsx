import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const DashboardLayout = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 ml-60 flex flex-col">
        {/* Persistent Header */}
        <Header />

        {/* Dynamic Main Content Center */}
        <main className="flex-1 mt-16 overflow-y-auto">
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
