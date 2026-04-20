import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import logo from '/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { motion } from 'framer-motion';

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/50 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Brand Section */}
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-28 h-28 shadow-2xl shadow-blue-500/10 flex items-center justify-center p-6">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </motion.div>
          <h1 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight leading-[1.1]">
            Welcome to <br /> 
            <span className="text-indigo-600">GAP Social-pilot</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[280px]">
            Broadcast your content to Instagram, YouTube, and beyond in one click
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to continue</h2>
            <p className="text-slate-400 text-[13px] font-medium">
              Connect your Google account to get started
            </p>
          </div>

          {/* Google Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 group mb-10 shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-slate-700 font-bold text-[15px]">Continue with Google</span>
          </motion.button>

          <div className="pt-10 border-t border-slate-100">
            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <LogIn className="w-4 h-4 text-indigo-600" strokeWidth={2.5} />
              </div>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                By signing in, you'll get access to broadcasting tools for Instagram Reels and YouTube Shorts
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
