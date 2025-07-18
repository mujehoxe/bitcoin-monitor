// Simple test to verify deduplication logic
console.log('🔍 Testing deduplication logic...');

// Simulate posts with some duplicates
const mockPosts = [
  { id: 'post1', authorName: 'Alice', content: 'Test post 1' },
  { id: 'post2', authorName: 'Bob', content: 'Test post 2' },
  { id: 'post1', authorName: 'Alice', content: 'Test post 1' }, // Duplicate
  { id: 'post3', authorName: 'Charlie', content: 'Test post 3' },
  { id: 'post2', authorName: 'Bob', content: 'Test post 2' }, // Duplicate
  { id: 'post4', authorName: 'David', content: 'Test post 4' },
];

console.log('📊 Total posts:', mockPosts.length);

// Current approach: Using Set to track seen post IDs
const seenIds = new Set();
const deduplicatedPosts = mockPosts.filter(post => {
  if (seenIds.has(post.id)) {
    return false; // Skip duplicate
  }
  seenIds.add(post.id);
  return true;
});

console.log('✅ After deduplication:', deduplicatedPosts.length);
console.log('📋 Unique post IDs:', Array.from(seenIds));

// Test the device info randomization
function generateRandomDeviceInfo() {
  const randomValues = {
    canvas_code: Math.random().toString(36).substring(2, 10),
    fingerprint: Math.random().toString(36).substring(2, 34),
    audio: (Math.random() * 200 + 100).toFixed(14),
    screen_resolution: Math.random() > 0.5 ? "1920,1080" : "1366,768",
  };
  
  const deviceInfo = {
    screen_resolution: randomValues.screen_resolution,
    canvas_code: randomValues.canvas_code,
    fingerprint: randomValues.fingerprint,
    audio: randomValues.audio,
    // ... other fixed values
  };
  
  return Buffer.from(JSON.stringify(deviceInfo)).toString('base64');
}

console.log('\n🔧 Testing device info randomization...');
const deviceInfo1 = generateRandomDeviceInfo();
const deviceInfo2 = generateRandomDeviceInfo();

console.log('Device info 1 (first 50 chars):', deviceInfo1.substring(0, 50));
console.log('Device info 2 (first 50 chars):', deviceInfo2.substring(0, 50));
console.log('Are they different?', deviceInfo1 !== deviceInfo2);

console.log('\n✅ Deduplication test completed successfully!');
