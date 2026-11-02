process.env.VERCEL = process.env.VERCEL || '1';
const app = require('../backend/server');

module.exports = app;
