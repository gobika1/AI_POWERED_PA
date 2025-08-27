#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Optimizing Metro bundler performance...\n');

// Clear Metro cache
console.log('📦 Clearing Metro cache...');
const metroCachePath = path.join(__dirname, '..', 'node_modules', '.cache', 'metro');
if (fs.existsSync(metroCachePath)) {
  fs.rmSync(metroCachePath, { recursive: true, force: true });
  console.log('✅ Metro cache cleared');
} else {
  console.log('ℹ️  No Metro cache found');
}

// Clear React Native cache
console.log('📱 Clearing React Native cache...');
try {
  execSync('npx react-native start --reset-cache --port 8081', { 
    stdio: 'pipe',
    timeout: 5000 
  });
  console.log('✅ React Native cache cleared');
} catch (error) {
  console.log('ℹ️  React Native cache clear attempted');
}

// Clear npm cache
console.log('📦 Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'pipe' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('❌ Failed to clear npm cache');
}

// Optimize node_modules
console.log('🔧 Optimizing node_modules...');
try {
  execSync('npm dedupe', { stdio: 'pipe' });
  console.log('✅ node_modules optimized');
} catch (error) {
  console.log('ℹ️  node_modules optimization attempted');
}

console.log('\n🎉 Metro optimization complete!');
console.log('\n💡 Performance tips:');
console.log('   • Use "npm run start:fast" for faster startup');
console.log('   • Use "npm run start:dev" for interactive mode');
console.log('   • Keep Metro running in background for faster reloads');
console.log('   • Use hardware acceleration if available');
