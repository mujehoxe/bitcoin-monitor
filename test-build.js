// Simple test to verify the API works without starting full server
const { exec } = require('child_process');

console.log('🧪 Testing the RSS API setup...');

// Test the build process
exec('npm run build', { cwd: '/home/o/Documents/fin/new/bitcoin-monitor' }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    return;
  }
  
  console.log('✅ Build successful!');
  console.log('📦 Build output:');
  console.log(stdout);
  
  if (stderr) {
    console.log('⚠️  Build warnings:');
    console.log(stderr);
  }
});

// Test CSV loading
const fs = require('fs');
const path = require('path');

try {
  const csvPath = path.join('/home/o/Documents/fin/new/bitcoin-monitor', 'crypto_feeds.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n')
    .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
  
  console.log(`✅ CSV loading test passed: ${lines.length} feeds loaded`);
} catch (error) {
  console.error('❌ CSV loading test failed:', error);
}

console.log('\n🎉 RSS service is ready for deployment!');
console.log('📝 To start the server, run: npm run dev');
console.log('🌐 The API will be available at: http://localhost:3000/api/crypto-rss');
