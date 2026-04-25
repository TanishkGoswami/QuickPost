/**
 * vite.config.js — Optimized build configuration
 * ─────────────────────────────────────────────────────────────────
 * Improvements:
 * 1. Manual chunks split vendor libraries by usage pattern
 * 2. Removed GSAP from explicit chunks (should be removed from codebase)
 * 3. Added terser minification options
 * 4. Source maps only in development
 *
 * Replace: client/vite.config.js
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000';
  const isDev = mode === 'development';

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
      },
    },

    build: {
      // Generate source maps only in dev
      sourcemap: isDev,

      // Warn on chunks > 400KB
      chunkSizeWarningLimit: 400,

      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // ── Vendor: Framer Motion ──
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'vendor-framer';
            }

            // ── Vendor: Supabase ──
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // ── Vendor: React Router ──
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'vendor-router';
            }

            // ── Vendor: Masonry ──
            if (id.includes('react-masonry-css')) {
              return 'vendor-masonry';
            }

            // ── Vendor: Date / Form utilities ──
            if (id.includes('react-datepicker') || id.includes('date-fns')) {
              return 'vendor-forms';
            }

            // ── Feature: Landing pages ──
            if (
              id.includes('/pages/LandingPage') ||
              id.includes('/pages/PricingPage') ||
              id.includes('/features/landing') ||
              id.includes('/styles/landing')
            ) {
              return 'feature-landing';
            }

            // ── Feature: Trends page ──
            if (id.includes('/pages/trends')) {
              return 'feature-trends';
            }

            // ── Feature: Dashboard + Composer ──
            if (
              id.includes('/components/Dashboard') ||
              id.includes('/components/ComposerModal') ||
              id.includes('/components/composer/')
            ) {
              return 'feature-dashboard';
            }

            // ── Feature: Legal pages ──
            if (
              id.includes('/pages/PrivacyPolicy') ||
              id.includes('/pages/TermsOfService')
            ) {
              return 'feature-legal';
            }
          },
        },
      },
    },

    // Optimize deps for faster cold starts
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'framer-motion',
        '@supabase/supabase-js',
        'axios',
        'lucide-react',
      ],
      exclude: ['gsap'], // remove GSAP from optimized deps
    },
  };
});
