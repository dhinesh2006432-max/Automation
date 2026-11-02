process.env.VERCEL = process.env.VERCEL || '1';
let app;
try {
  app = require('../frontend/backend/server');
} catch (e) {
  app = require('../backend/server');
}

module.exports = app;
