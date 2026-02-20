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
  CLEAN PRODUCTION CORS
  Allows:
  - localhost dev
  - any Vercel deployment
*/

app.use(cors({
  origin: [
    "http://localhost:3000",
    /\.vercel\.app$/
  ],
  credentials: true
}));

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

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Clinic Audit SaaS API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
