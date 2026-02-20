const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const auditsRoutes = require('./routes/audits');
const goalsRoutes = require('./routes/goals');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

/*
  PRODUCTION-SAFE CORS CONFIG
  Allows:
  - Vercel production frontend
  - Any Vercel preview deployment
  - Local development
*/

const allowedOrigins = [
  "http://localhost:3000",
  "https://clinic-audit-saas.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) return next();

  if (
    allowedOrigins.includes(origin) ||
    origin.endsWith(".vercel.app")
  ) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Clinic Audit SaaS API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
