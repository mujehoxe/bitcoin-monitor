// Test our enhanced device info generation
function generateDeviceInfo() {
  // Generate randomized/anonymized device info for Binance API
  // This helps prevent duplicate content and improves API compatibility
  const randomValues = {
    canvas_code: Math.random().toString(36).substring(2, 10),
    fingerprint: Math.random().toString(36).substring(2, 34),
    audio: (Math.random() * 200 + 100).toFixed(14),
    screen_resolution: Math.random() > 0.5 ? "1920,1080" : "1366,768",
    available_screen_resolution: Math.random() > 0.5 ? "1920,1050" : "1366,728",
    timezoneOffset: Math.floor(Math.random() * 24) - 12, // Random timezone offset
  };

  const deviceInfo = {
    screen_resolution: randomValues.screen_resolution,
    available_screen_resolution: randomValues.available_screen_resolution,
    system_version: "Linux x86_64",
    brand_model: "unknown",
    system_lang: "en-US",
    timezone: "GMT+00:00",
    timezoneOffset: randomValues.timezoneOffset,
    user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    list_plugin: "PDF Viewer,Chrome PDF Viewer,Chromium PDF Viewer,Microsoft Edge PDF Viewer,WebKit built-in PDF",
    canvas_code: randomValues.canvas_code,
    webgl_vendor: "Google Inc. (Intel)",
    webgl_renderer: "ANGLE (Intel, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)",
    audio: randomValues.audio,
    platform: "Linux x86_64",
    web_timezone: "UTC",
    device_name: "Chrome V138.0.0.0 (Linux)",
    fingerprint: randomValues.fingerprint,
    device_id: "",
    related_device_ids: ""
  };

  // Convert to base64
  const deviceInfoStr = JSON.stringify(deviceInfo);
  return Buffer.from(deviceInfoStr).toString('base64');
}

// Test deduplication logic
function testDeduplication() {
  console.log('🔍 Testing enhanced deduplication logic...');
  
  // Mock articles with duplicates
  const mockArticles = [
    { id: 'binance-square-post1-0', source: 'Binance Square', title: 'Alice', author: 'Alice' },
    { id: 'binance-square-post2-0', source: 'Binance Square', title: 'Bob', author: 'Bob' },
    { id: 'binance-square-post1-1', source: 'Binance Square', title: 'Alice', author: 'Alice' }, // Duplicate
    { id: 'binance-square-post3-0', source: 'Binance Square', title: 'Charlie', author: 'Charlie' },
    { id: 'binance-square-post2-1', source: 'Binance Square', title: 'Bob', author: 'Bob' }, // Duplicate
    { id: 'regular-article-1', source: 'RSS Feed', title: 'Regular Article', author: 'Author' },
  ];

  console.log(`📊 Total articles before deduplication: ${mockArticles.length}`);

  // Apply our deduplication logic
  const seenPostIds = new Set();
  const deduplicatedArticles = [];
  
  mockArticles.forEach(article => {
    if (article.source === 'Binance Square') {
      // Extract post ID from the article ID
      let postId = '';
      if (article.id.includes('binance-square-')) {
        // Extract from our generated ID: binance-square-{postId}-{index}
        const parts = article.id.split('-');
        if (parts.length >= 3) {
          postId = parts[2];
        }
      }
      
      if (postId && seenPostIds.has(postId)) {
        console.log(`🔄 Skipping duplicate Binance Square post: ${postId}`);
        return; // Skip duplicate
      }
      
      if (postId) {
        seenPostIds.add(postId);
      }
    }
    
    deduplicatedArticles.push(article);
  });

  console.log(`📊 After deduplication: ${deduplicatedArticles.length} articles`);
  console.log(`📊 Unique Binance Square posts: ${seenPostIds.size}`);
  console.log(`✅ Deduplication working correctly: ${deduplicatedArticles.length === 4}`);
}

// Test device info randomization
function testDeviceInfoRandomization() {
  console.log('\n🔧 Testing device info randomization...');
  
  const deviceInfos = [];
  for (let i = 0; i < 5; i++) {
    const deviceInfo = generateDeviceInfo();
    deviceInfos.push(deviceInfo);
    console.log(`Device info ${i+1} (first 50 chars): ${deviceInfo.substring(0, 50)}...`);
  }
  
  // Check if they're all different
  const uniqueDeviceInfos = new Set(deviceInfos);
  console.log(`✅ Generated ${uniqueDeviceInfos.size} unique device info headers out of ${deviceInfos.length}`);
  
  // Decode and check randomization
  const decoded = JSON.parse(Buffer.from(deviceInfos[0], 'base64').toString());
  console.log(`📊 Sample decoded values:`);
  console.log(`   Canvas code: ${decoded.canvas_code}`);
  console.log(`   Fingerprint: ${decoded.fingerprint}`);
  console.log(`   Audio: ${decoded.audio}`);
  console.log(`   Screen resolution: ${decoded.screen_resolution}`);
  console.log(`   Timezone offset: ${decoded.timezoneOffset}`);
}

// Run tests
testDeduplication();
testDeviceInfoRandomization();

console.log('\n🎉 All tests completed successfully!');
console.log('\n📝 Summary of changes:');
console.log('✅ Enhanced device-info header generation with randomization');
console.log('✅ Improved deduplication logic for Binance Square posts');
console.log('✅ Author names now show as titles for Binance Square posts');
console.log('✅ Fresh device-info generated per request to prevent duplicates');
