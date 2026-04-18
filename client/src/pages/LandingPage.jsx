import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hero, Features, HowItWorks, SocialProof, CallToAction, LandingNav } from '../features/landing';
import '../styles/landing.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <CallToAction />
      
      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="landing-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600 text-sm">
              © 2025 QuickPost. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-gray-600 text-sm">
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
