const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[Vercel Build] Current working directory:', process.cwd());

if (fs.existsSync('./src') && fs.existsSync('./vite.config.js')) {
  // Current directory is already 'frontend'
  console.log('[Vercel Build] Detected frontend directory. Installing dependencies & building...');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });

  // Ensure dist is available in both ./dist and ./frontend/dist
  if (fs.existsSync('./dist')) {
    if (!fs.existsSync('./frontend')) fs.mkdirSync('./frontend');
    fs.cpSync('./dist', './frontend/dist', { recursive: true });
  }
} else if (fs.existsSync('./frontend/package.json')) {
  // Current directory is root
  console.log('[Vercel Build] Detected root directory. Installing & building frontend...');
  execSync('npm install --prefix frontend', { stdio: 'inherit' });
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });

  // Ensure dist is available in both ./dist and ./frontend/dist
  if (fs.existsSync('./frontend/dist')) {
    fs.cpSync('./frontend/dist', './dist', { recursive: true });
  }
} else {
  console.log('[Vercel Build] Fallback build...');
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('[Vercel Build] Build finished successfully!');
