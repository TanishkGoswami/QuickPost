import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(getErrorMessage(error));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('Authentication failed. No token received.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Store token and login
        login(token);
        setStatus('success');
        setMessage(`Successfully signed in with ${provider === 'google' ? 'Google' : 'Instagram'}!`);
        
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, login]);

  const getErrorMessage = (error) => {
    const messages = {
      'access_denied': 'You denied access. Please try again.',
      'google_oauth_failed': 'Google authentication failed. Please try again.',
      'authentication_failed': 'Authentication failed. Please try again.',
      'no_code': 'Invalid authentication code.',
      'instagram_oauth_failed': 'Instagram connection failed.',
      'instagram_connection_failed': 'Failed to connect Instagram account.'
    };
    return messages[error] || 'An unknown error occurred';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="glass-card p-12 max-w-md w-full text-center animate-fade-in">
        {status === 'processing' && (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Signing you in...</h2>
              <p className="text-white/60">{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-white/60">{message}</p>
              <p className="text-sm text-white/40 mt-4">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
              <p className="text-white/60">{message}</p>
              <p className="text-sm text-white/40 mt-4">Redirecting to login...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
