// Test script to verify backend setup
const path = require('path');

console.log('Current directory:', process.cwd());
console.log('Backend directory exists:', require('fs').existsSync('./backend'));
console.log('Backend package.json exists:', require('fs').existsSync('./backend/package.json'));

if (require('fs').existsSync('./backend/package.json')) {
  const pkg = require('./backend/package.json');
  console.log('Backend package name:', pkg.name);
  console.log('Scripts available:', Object.keys(pkg.scripts || {}));
}

// Test the frontend build
console.log('Frontend dist exists:', require('fs').existsSync('./frontend/dist'));
console.log('Frontend build files:', require('fs').existsSync('./frontend/dist/index.html'));