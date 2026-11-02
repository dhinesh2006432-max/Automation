const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine upload directory (Vercel serverless vs Local)
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.error('Upload dir creation warning:', e.message);
  }
}

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// Register API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Base Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'College Hostel Room Allocation & Management API Server',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Hostel Management API Backend running on port ${PORT}`);
    console.log(`📡 Healthcheck: http://localhost:${PORT}/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
