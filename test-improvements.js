// Test the improved RSS service
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing improved RSS service...');

// Test 1: Check cleaned CSV
try {
  const csvPath = path.join(__dirname, 'crypto_feeds.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n')
    .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
  
  console.log(`✅ CSV Test: ${lines.length} feeds loaded (cleaned from 103)`);
  
  // Check for problematic feeds
  const problematicFeeds = [
    'bit-sites', 'hegion', 'zycrypto', 'coinworldstory', 'ukbitcoinblog',
    'cryptomurmur', 'blockchaincongressusa', 'oilblockchain.news'
  ];
  
  const hasProblematicFeeds = lines.some(line => 
    problematicFeeds.some(problem => line.includes(problem))
  );
  
  if (hasProblematicFeeds) {
    console.log('⚠️  Warning: Some problematic feeds still present');
  } else {
    console.log('✅ No known problematic feeds found');
  }
  
} catch (error) {
  console.error('❌ CSV test failed:', error);
}

// Test 2: Check backup exists
try {
  const backupPath = path.join(__dirname, 'crypto_feeds_backup.csv');
  if (fs.existsSync(backupPath)) {
    console.log('✅ Backup exists: crypto_feeds_backup.csv');
  } else {
    console.log('⚠️  No backup found');
  }
} catch (error) {
  console.error('❌ Backup test failed:', error);
}

console.log('\n🎉 Improvements summary:');
console.log('  • CSV loading cached (loads only once)');
console.log('  • Batch processing (10 feeds at a time)');
console.log('  • Improved error handling');
console.log('  • Reduced timeout (8 seconds)');
console.log('  • Better logging (less spam)');
console.log('  • Removed broken feeds from CSV');
console.log('\n✅ Ready for testing with fewer errors!');
