#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Metro bundler with optimizations...\n');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('📁 Creating assets directory...');
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✅ Assets directory created');
}

// Clear any existing Metro processes
console.log('🔄 Clearing existing Metro processes...');
try {
  execSync('taskkill /f /im node.exe', { stdio: 'pipe' });
  console.log('✅ Existing processes cleared');
} catch (error) {
  console.log('ℹ️  No existing processes to clear');
}

// Start Metro with optimizations
console.log('🚀 Starting Metro bundler...');
try {
  execSync('npx react-native start --reset-cache', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.log('❌ Metro failed to start');
  console.log('💡 Try running: npm run start');
  process.exit(1);
}
