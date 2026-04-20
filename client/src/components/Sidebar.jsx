import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Settings, Zap, CheckCircle2, HelpCircle, PanelLeftClose, Clock, LogOut } from 'lucide-react';
import logo from '/logo.png';
import InstagramBusinessSetupModal from './InstagramBusinessSetupModal';
import BlueskyConnectModal from './BlueskyConnectModal';
import PinterestConnectModal from './PinterestConnectModal';
import LinkedInConnectModal from './LinkedInConnectModal';
import MastodonConnectModal from './MastodonConnectModal';
import TikTokConnectModal from './TikTokConnectModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, connectedAccounts, refreshAccounts, logout } = useAuth();
  const [showBusinessSetupModal, setShowBusinessSetupModal] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showPinterestModal, setShowPinterestModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showMastodonModal, setShowMastodonModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState(null);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleConnectInstagram = () => {
    // Show setup modal first to ensure user has business account
    setShowBusinessSetupModal(true);
  };

  const handleProceedToConnect = () => {
    setShowBusinessSetupModal(false);
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/instagram?token=${token}`;
  };

  const handleConnectFacebook = () => {
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/facebook?token=${token}`;
  };

  const handleConnectThreads = () => {
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/threads?token=${token}`;
  };

  const handleConnectX = () => {
    console.log('𝕏 Initiating X connection...');
    setConnectingPlatform('x');
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/x?token=${token}`;
  };

  const handleConnectReddit = () => {
    console.log('🤖 Initiating Reddit connection...');
    setConnectingPlatform('reddit');
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${API_BASE_URL}/api/auth/reddit?token=${token}`;
  };

  const handleDisconnect = async (platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    setDisconnectingPlatform(platform);
    try {
      const token = localStorage.getItem('quickpost_token');
      const response = await fetch(`${API_BASE_URL}/api/auth/disconnect/${platform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await refreshAccounts();
      } else {
        alert(`Failed to disconnect: ${data.error}`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect account');
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const handleConnectPinterest = () => {
    setShowPinterestModal(true);
  };

  const handleConnectLinkedIn = () => {
    setShowLinkedInModal(true);
  };

  const handleConnectMastodon = () => {
    setShowMastodonModal(true);
  };

  const handleConnectTikTok = () => {
    setShowTikTokModal(true);
  };

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      connected: connectedAccounts.facebook,
      icon: (
        <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      connectText: 'Connect Facebook',
      onConnect: handleConnectFacebook,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      connected: connectedAccounts.instagram,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="url(#instagram-gradient-sidebar)">
          <defs>
            <linearGradient id="instagram-gradient-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#833AB4" />
              <stop offset="50%" stopColor="#E1306C" />
              <stop offset="100%" stopColor="#FCAF45" />
            </linearGradient>
          </defs>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      connectText: 'Connect Instagram',
      onConnect: handleConnectInstagram,
    },
    {
      id: 'x',
      name: 'X',
      connected: connectedAccounts.x,
      icon: (
        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z"/>
        </svg>
      ),
      connectText: 'Connect X',
      onConnect: handleConnectX,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      connected: connectedAccounts.linkedin,
      icon: (
        <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      connectText: 'Connect LinkedIn',
      onConnect: handleConnectLinkedIn,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      connected: connectedAccounts.tiktok,
      icon: (
        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      connectText: 'Connect TikTok',
      onConnect: handleConnectTikTok,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      connected: connectedAccounts.youtube,
      icon: (
        <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      connectText: 'Connect YouTube',
      onConnect: () => alert('YouTube is connected via Google sign-in'),
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      connected: connectedAccounts.pinterest,
      icon: (
        <svg className="w-5 h-5 text-[#E60023]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0a12 12 0 0 0-4.37 23.17c-.06-.56-.12-1.43 0-2.05l.87-3.65s-.22-.44-.22-1.09c0-1 .6-1.78 1.34-1.78.63 0 .94.48.94 1.05 0 .64-.41 1.6-.62 2.49-.18.74.37 1.34 1.1 1.34 1.32 0 2.33-1.39 2.33-3.4 0-1.78-1.28-3.02-3.1-3.02-2.11 0-3.35 1.58-3.35 3.22 0 .64.24 1.32.55 1.69.06.07.07.14.05.21l-.2.84c-.03.13-.11.16-.25.1-1-.46-1.62-1.91-1.62-3.07 0-2.34 1.7-4.49 4.9-4.49 2.57 0 4.57 1.83 4.57 4.28 0 2.55-1.61 4.6-3.85 4.6-.75 0-1.46-.39-1.7-.85l-.46 1.76c-.17.64-.62 1.44-.92 1.93.69.21 1.42.33 2.17.33A12 12 0 1 0 12 0z"/>
        </svg>
      ),
      connectText: 'Connect Pinterest',
      onConnect: handleConnectPinterest,
    },
    {
      id: 'threads',
      name: 'Threads',
      connected: connectedAccounts.threads,
      icon: (
        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.74-1.763-.507-.598-1.256-.918-2.228-.952-1.281-.046-2.345.335-3.265 1.169l-1.207-1.555c1.319-1.025 2.971-1.531 4.915-1.504 1.5.054 2.682.567 3.513 1.525.799.921 1.276 2.13 1.427 3.598.433.086.838.186 1.212.298 1.438.433 2.455 1.098 3.026 1.977.638 1 .76 2.352.35 3.908-.54 2.055-1.906 3.753-3.838 4.781-1.558.828-3.394 1.256-5.462 1.277z"/>
        </svg>
      ),
      connectText: 'Connect Threads',
      onConnect: handleConnectThreads,
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      connected: connectedAccounts.mastodon,
      icon: (
        <svg className="w-5 h-5 text-[#6364FF]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
        </svg>
      ),
      connectText: 'Connect Mastodon',
      onConnect: handleConnectMastodon,
    },
    {
      id: 'bluesky',
      name: 'Bluesky',
      connected: connectedAccounts.bluesky,
      icon: (
        <svg className="w-5 h-5 text-[#0085FF]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
        </svg>
      ),
      connectText: 'Connect Bluesky',
      onConnect: () => setShowBlueskyModal(true),
    },
    {
      id: 'google-business',
      name: 'Google Business',
      connected: connectedAccounts.googleBusiness,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      connectText: 'Connect Google Business',
      onConnect: () => alert('Google Business Profile integration coming soon!'),
    },
    {
      id: 'reddit',
      name: 'Reddit',
      connected: connectedAccounts.reddit,
      icon: (
        <svg className="w-5 h-5 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 11.5c0-1.65-1.35-3-3-3-.41 0-.8.08-1.15.22C18.21 7.27 15.71 6.5 13 6.5c-.01 0-.02 0-.03.01l1.32-4.19c.01-.03 0-.07-.02-.1-.02-.03-.05-.05-.08-.05l-4.44.93c-.15-.47-.59-.81-1.11-.81-.66 0-1.2.54-1.2 1.2s.54 1.2 1.2 1.2c.5 0 .93-.31 1.1-.74l3.87-.81-1.1 3.5c-2.73.04-5.24.81-6.85 2.23-.35-.14-.74-.22-1.15-.22-1.65 0-3 1.35-3 3 0 1.25.77 2.32 1.86 2.76-.04.24-.06.49-.06.74 0 3.31 4.03 6 9 6s9-2.69 9-6c0-.25-.02-.5-.06-.74 1.09-.44 1.86-1.51 1.86-2.76zM7.5 14c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm10.5 4.5c-1.84 0-3.48-.96-4.5-2.5-.1-.14-.07-.34.07-.44.15-.1.35-.07.45.07.9 1.37 2.37 2.22 3.98 2.22s3.08-.85 3.98-2.22c.1-.14.3-.17.44-.07.14.1.17.3.07.44-1.02 1.54-2.66 2.5-4.5 2.5zm1.5-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      connectText: 'Coming Soon',
      onConnect: () => alert('Reddit integration is currently awaiting API approval. It will be available shortly!'),
      disabled: true
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      connected: false,
      icon: (
        <svg className="w-5 h-5 text-[#FFFC00]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.4c.6 0 1.2.1 1.8.2.4.1.8.3 1.1.5.3.2.6.4.8.7.2.3.4.6.5.9.1.3.2.6.2.9 0 .4-.1.7-.2 1.1-.1.3-.3.6-.5.9-.2.3-.5.5-.8.7-.3.2-.7.4-1.1.5-.6.2-1.2.2-1.8.2-3.3 0-6 2.7-6 6s2.7 6 6 6c.6 0 1.2-.1 1.8-.2.4-.1.8-.3 1.1-.5.3-.2.6-.4.8-.7.2-.3.4-.6.5-.9.1-.3.2-.6.2-.9 0-.4-.1-.7-.2-1.1-.1-.3-.3-.6-.5-.9-.2-.3-.5-.5-.8-.7-.3-.2-.7-.4-1.1-.5-.6-.2-1.2-.2-1.8-.2-3.3 0-6-2.7-6-6s2.7-6 6-6z"/>
          {/* Simplified Ghost shape for Snapchat */}
          <path d="M12 2c4.418 0 8 3.582 8 8 0 1.341-.331 2.603-.913 3.712.593.456 1.413 1.288 1.413 2.288 0 .5-.1.9-.3 1.2-.2.3-.5.5-.9.7-.4.2-.9.3-1.4.3-.5 0-1-.1-1.4-.3-.4-.2-.7-.4-.9-.7l-.4-.6c-1 1-2.3 1.6-3.8 1.6-1.5 0-2.8-.6-3.8-1.6l-.4.6c-.2.3-.5.5-.9.7l-1.4.3c-.5 0-1-.1-1.4-.3-.4-.2-.7-.4-.9-.7-.2-.3-.3-.7-.3-1.2 0-1 1.18-2.168 1.413-2.288C2.331 12.603 2 11.341 2 10c0-4.418 3.582-8 8-8z"/>
        </svg>
      ),
      connectText: 'Coming Soon',
      onConnect: () => alert('Snapchat integration is in development!'),
      disabled: true
    }
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <img src={logo} alt="QuickPost" className="h-8 w-8 object-contain" />
          </div>
        ) : (
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="QuickPost" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold text-gray-900">QuickPost</span>
          </Link>
        )}
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-3`}>
            {!isCollapsed && <h3 className="text-sm font-semibold text-gray-700">Channels</h3>}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* All Channels */}
          <Link
            to="/dashboard"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-2 transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title={isCollapsed ? "All Channels" : ""}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">All Channels</div>
              </div>
            )}
          </Link>

          {/* Connected Channels */}
          {platforms.filter(p => p.connected).map((platform) => (
            <div
              key={platform.id}
              className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-2 text-gray-700 hover:bg-gray-50`}
              title={isCollapsed ? `${user?.name || user?.email} - ${platform.name}` : ""}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {platform.icon}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>{platform.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={disconnectingPlatform === platform.id}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-opacity disabled:opacity-50"
                    title="Disconnect"
                  >
                    {disconnectingPlatform === platform.id ? '...' : '×'}
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Connect Buttons */}
          {!isCollapsed && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
              {platforms.filter(p => !p.connected).map((platform) => {
                const isConnecting = connectingPlatform === platform.id;
                return (
                  <button
                    key={platform.id}
                    onClick={platform.onConnect}
                    disabled={isConnecting}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left transition-all ${
                      isConnecting ? 'bg-gray-50 cursor-wait' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-opacity ${
                      isConnecting ? 'opacity-100 animate-pulse' : 'opacity-40 group-hover:opacity-100'
                    }`}>
                      {platform.icon}
                    </div>
                    <span className={`text-sm transition-opacity ${
                      isConnecting ? 'opacity-100 font-medium' : 'opacity-70 group-hover:opacity-100'
                    }`}>
                      {isConnecting ? `Connecting ${platform.name}...` : platform.connectText}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg w-full text-gray-700 hover:bg-gray-50 text-sm`}
          title={isCollapsed ? "Settings" : ""}
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button 
          onClick={handleLogout}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg w-full text-red-600 hover:bg-red-50 text-sm mt-1`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Instagram Business Setup Modal */}
      <InstagramBusinessSetupModal
        isOpen={showBusinessSetupModal}
        onClose={() => setShowBusinessSetupModal(false)}
        onProceed={handleProceedToConnect}
      />

      {/* Bluesky Connect Modal */}
      <BlueskyConnectModal
        isOpen={showBlueskyModal}
        onClose={() => setShowBlueskyModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* Pinterest Connect Modal */}
      <PinterestConnectModal
        isOpen={showPinterestModal}
        onClose={() => setShowPinterestModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* LinkedIn Connect Modal */}
      <LinkedInConnectModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* Mastodon Connect Modal */}
      <MastodonConnectModal
        isOpen={showMastodonModal}
        onClose={() => setShowMastodonModal(false)}
        onSuccess={refreshAccounts}
      />

      {/* TikTok Connect Modal */}
      <TikTokConnectModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
        onSuccess={refreshAccounts}
      />
    </aside>
  );
}

export default Sidebar;
