'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import logo from '/logo.png';
import {
  AppleIcon,
  AtSignIcon,
  ChevronLeftIcon,
  GithubIcon,
  Loader2,
  Lock,
  User,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AuthPage() {
  const { login, signUp, googleSignIn } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signUp(email, password, name);
        setError('Check your email for the confirmation link!');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleSignIn();
    } catch (err) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 bg-background font-sans">
      {/* Left side - Branding & Hero */}
      <div className="bg-muted/10 relative hidden h-full flex-col border-r p-10 lg:flex">
        <div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent opacity-30" />
        <div className="z-20 flex items-center gap-4">
          <img src={logo} alt="QuickPost" className="size-12 object-contain" />
          <p className="text-3xl font-bold tracking-tight text-ink">GAP SocialPilot</p>
        </div>
        
        <div className="z-20 mt-auto">
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium leading-relaxed text-ink/90">
              &ldquo;QuickPost has completely transformed how I handle multi-platform content. What used to take hours now takes minutes.&rdquo;
            </p>
            <footer className="font-mono text-sm font-bold uppercase tracking-wider text-arc">
              — Sarah K. · Content Strategist
            </footer>
          </blockquote>
        </div>

        {/* Animated Background Paths */}
        <div className="absolute inset-0 z-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="relative flex min-h-screen flex-col justify-center p-6 md:p-12">
        <div
          aria-hidden
          className="absolute inset-0 isolate contain-strict -z-10 opacity-40 pointer-events-none"
        >
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,var(--arc)_0,transparent_70%)] absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 opacity-10 blur-3xl rounded-full" style={{ willChange: "transform" }} />
        </div>

        <Button 
          variant="ghost" 
          className="absolute top-8 left-8 hover:bg-muted/50" 
          onClick={() => navigate('/')}
        >
          <ChevronLeftIcon className='size-4 me-2' />
          Back to Home
        </Button>

        <div className="mx-auto w-full max-w-[400px] space-y-8">
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <img src={logo} alt="QuickPost" className="size-8 object-contain" />
            <p className="text-2xl font-bold text-ink">GAP SocialPilot</p>
          </div>

          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              {mode === 'login' ? 'Welcome back' : 'Start broadcasting'}
            </h1>
            <p className="text-slate text-base">
              {mode === 'login' 
                ? 'Sign in to manage your social channels.' 
                : 'Create your account to start reaching more people.'}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <Button 
              type="button" 
              variant="outline"
              size="lg" 
              className="w-full h-12 border-muted hover:bg-muted/50 font-semibold"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon className='size-5 me-3' />
              Continue with Google
            </Button>
            {/* You can add GitHub/Apple here if implemented in useAuth */}
          </div>

          <AuthSeparator />

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate ml-1">Full Name</label>
                <div className="relative">
                  <Input
                    placeholder="Jane Doe"
                    className="h-12 ps-10 border-muted focus:border-arc transition-all bg-white"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                    <User className="size-4 text-slate" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate ml-1">Email Address</label>
              <div className="relative">
                <Input
                  placeholder="name@example.com"
                  className="h-12 ps-10 border-muted focus:border-arc transition-all bg-white"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <AtSignIcon className="size-4 text-slate" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate ml-1">Password</label>
              <div className="relative">
                <Input
                  placeholder="••••••••"
                  className="h-12 ps-10 border-muted focus:border-arc transition-all bg-white"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <Lock className="size-4 text-slate" />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-12 bg-ink hover:bg-ink/90 text-white font-bold" disabled={loading}>
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="size-5 ms-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate pt-4">
            {mode === 'login' ? "New here?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-arc font-bold hover:underline underline-offset-4"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

function FloatingPaths({ position }) {
  const paths = React.useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 15 * position} -${189 + i * 18}C-${
        380 - i * 15 * position
      } -${189 + i * 18} -${312 - i * 15 * position} ${216 - i * 18} ${
        152 - i * 15 * position
      } ${343 - i * 18}C${616 - i * 15 * position} ${470 - i * 18} ${
        684 - i * 15 * position
      } ${875 - i * 18} ${684 - i * 15 * position} ${875 - i * 18}`,
      color: `rgba(243, 115, 56, ${0.1 + i * 0.05})`,
      width: 1 + i * 0.1,
      duration: 15 + Math.random() * 10,
    })), [position]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="h-full w-full opacity-40"
        viewBox="0 0 696 316"
        fill="none"
        style={{ willChange: "transform" }}
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke={path.color}
            strokeWidth={path.width}
            initial={{ pathLength: 0.3, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.4, 0],
              pathOffset: [0, 1],
            }}
            transition={{
              duration: path.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

const GoogleIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
  </svg>
);

const AuthSeparator = () => {
  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div className="bg-muted h-[1px] w-full" />
      <span className="text-slate px-2 text-xs font-bold uppercase tracking-wider">OR</span>
      <div className="bg-muted h-[1px] w-full" />
    </div>
  );
};
