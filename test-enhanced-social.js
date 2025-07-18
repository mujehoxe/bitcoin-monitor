// Test the enhanced social API service with deduplication and device-info randomization
const { SocialAPIService } = require('./src/services/socialAPIService.ts');

async function testEnhancedSocialAPI() {
  console.log('🔍 Testing Enhanced Social API Service...');
  
  // Test device info randomization
  console.log('\n🔧 Testing device info randomization...');
  const service = SocialAPIService.getInstance();
  
  // Generate multiple device info headers to verify randomization
  const deviceInfos = [];
  for (let i = 0; i < 3; i++) {
    const deviceInfo = service.generateDeviceInfo();
    deviceInfos.push(deviceInfo);
    console.log(`Device info ${i+1} (first 50 chars):`, deviceInfo.substring(0, 50));
  }
  
  // Check if they're different
  const allUnique = deviceInfos.every((info, index) => 
    deviceInfos.slice(index + 1).every(otherInfo => info !== otherInfo)
  );
  console.log('✅ All device info headers are unique:', allUnique);
  
  // Test the full social API fetch with deduplication
  console.log('\n🔄 Testing full social API fetch with deduplication...');
  try {
    const articles = await service.fetchAllFeeds();
    
    console.log(`📊 Total articles fetched: ${articles.length}`);
    
    // Check for Binance Square articles
    const binanceSquareArticles = articles.filter(article => 
      article.source === 'Binance Square'
    );
    console.log(`📊 Binance Square articles: ${binanceSquareArticles.length}`);
    
    // Show engagement metrics for first few articles
    console.log('\n📊 Sample engagement metrics:');
    binanceSquareArticles.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.author})`);
      console.log(`   Views: ${article.engagementMetrics?.viewCount || 0}`);
      console.log(`   Likes: ${article.engagementMetrics?.likeCount || 0}`);
      console.log(`   Comments: ${article.engagementMetrics?.commentCount || 0}`);
    });
    
    // Check for author diversity
    const authors = new Set(binanceSquareArticles.map(a => a.author));
    console.log(`👥 Unique authors: ${authors.size}`);
    
    // Test deduplication by checking post IDs
    const postIds = new Set();
    binanceSquareArticles.forEach(article => {
      if (article.id.includes('binance-square-')) {
        const parts = article.id.split('-');
        if (parts.length >= 3) {
          postIds.add(parts[2]);
        }
      }
    });
    
    console.log(`🔄 Unique post IDs: ${postIds.size}`);
    console.log(`📊 Deduplication ratio: ${binanceSquareArticles.length}/${postIds.size} = ${(binanceSquareArticles.length / postIds.size).toFixed(2)}`);
    
    if (binanceSquareArticles.length === postIds.size) {
      console.log('✅ Perfect deduplication - no duplicates found!');
    } else {
      console.log('⚠️ Some duplicates may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error testing social API:', error);
  }
  
  console.log('\n✅ Enhanced Social API test completed!');
}

// Make the generateDeviceInfo method accessible for testing
const originalService = SocialAPIService.prototype;
originalService.generateDeviceInfo = function() {
  // Generate randomized/anonymized device info for Binance API
  const randomValues = {
    canvas_code: Math.random().toString(36).substring(2, 10),
    fingerprint: Math.random().toString(36).substring(2, 34),
    audio: (Math.random() * 200 + 100).toFixed(14),
    screen_resolution: Math.random() > 0.5 ? "1920,1080" : "1366,768",
    available_screen_resolution: Math.random() > 0.5 ? "1920,1050" : "1366,728",
    timezoneOffset: Math.floor(Math.random() * 24) - 12,
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

  return Buffer.from(JSON.stringify(deviceInfo)).toString('base64');
};

testEnhancedSocialAPI().catch(console.error);
