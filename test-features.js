#!/usr/bin/env node

console.log('🧪 Testing Key Features...');

// Test 1: Check if RSS service can be imported
try {
  const { CryptoRSSService } = require('./src/services/cryptoRSSService.ts');
  console.log('✅ RSS service import successful');
} catch (error) {
  console.log('❌ RSS service import failed:', error.message);
}

// Test 2: Check if Social API service can be imported
try {
  const { SocialAPIService } = require('./src/services/socialAPIService.ts');
  console.log('✅ Social API service import successful');
} catch (error) {
  console.log('❌ Social API service import failed:', error.message);
}

// Test 3: Check if Real-time news service can be imported
try {
  const { RealTimeNewsService } = require('./src/services/realTimeNewsService.ts');
  console.log('✅ Real-time news service import successful');
} catch (error) {
  console.log('❌ Real-time news service import failed:', error.message);
}

// Test 4: Check if feeds CSV exists
const fs = require('fs');
const path = require('path');
try {
  const csvPath = path.join(__dirname, 'crypto_feeds.csv');
  const exists = fs.existsSync(csvPath);
  if (exists) {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && line.startsWith('http'));
    console.log(`✅ Crypto feeds CSV loaded: ${lines.length} feeds`);
  } else {
    console.log('❌ Crypto feeds CSV not found');
  }
} catch (error) {
  console.log('❌ Crypto feeds CSV error:', error.message);
}

console.log('🎯 Feature test completed!');
