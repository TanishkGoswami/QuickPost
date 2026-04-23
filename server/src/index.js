import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load variables before other imports

import broadcastRouter from './routes/broadcast.js';
import authRouter from './routes/auth.js';
import broadcastsRouter from './routes/broadcasts.js';
import onboardingRouter from './routes/onboarding.js';
import jobsRouter from './routes/jobs.js';
import { initScheduler } from './services/scheduler.js';

// dotenv.config(); // Removed duplicate call below

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isNgrok = origin.includes('ngrok-free.dev');
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;

    if (isLocal || isNgrok || isAllowed) {
      return callback(null, true);
    }

    console.warn('🔞 [CORS] Blocked origin:', origin);
    return callback(new Error('CORS Not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With']
}));

// Explicitly handle preflight requests
app.options('*', cors());

// Add ngrok skip header to all responses
app.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (for Instagram public URL requirement)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', broadcastRouter);
app.use('/api', broadcastsRouter);
app.use('/api', onboardingRouter);
app.use('/api', jobsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'QuickPost API Server - OAuth Enabled',
    version: '2.0.0',
    endpoints: {
      auth: {
        googleLogin: 'GET /auth/google',
        instagramConnect: 'GET /auth/instagram (requires auth)',
        me: 'GET /auth/me (requires auth)',
        accounts: 'GET /auth/accounts (requires auth)',
        logout: 'POST /auth/logout'
      },
      api: {
        broadcast: 'POST /api/broadcast (requires auth)',
        health: 'GET /api/health'
      }
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     QuickPost API Server             ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
  
  // Initialize Post Scheduler
  initScheduler();

  console.log(`\n✨ Ready to broadcast!\n`);
});

// Set server timeout to 5 minutes for large uploads
server.timeout = 300000;
server.keepAliveTimeout = 300000;

export default app;
