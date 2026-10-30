import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import docRoutes from './routes/docRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import cloudRoutes from './routes/cloudRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Allowed Origins for CORS (Development & Production)
const allowedOrigins = [
  'https://ialksng.me',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for initial setup so user isn't blocked
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'SmartSphere MERN API',
  });
});

app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'SmartSphere MERN API',
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    env: {
      hasMongoUri: !!process.env.MONGO_URI,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
      frontendUrl: process.env.FRONTEND_URL || 'default',
    },
  });
});

// Primary API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dochub', docRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/cloud', cloudRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

// Aliases without /api prefix for compatibility with direct frontend calls
app.use('/auth', authRoutes);
app.use('/dochub', docRoutes);
app.use('/folders', folderRoutes);
app.use('/cloud', cloudRoutes);
app.use('/ai', aiRoutes);
app.use('/stats', statsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SmartSphere Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

