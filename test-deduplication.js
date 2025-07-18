const https = require('https');

// Generate anonymized device info for Binance API
function generateDeviceInfo() {
  // Randomize some values to make each request unique
  const randomValues = {
    canvas_code: Math.random().toString(36).substring(2, 10),
    fingerprint: Math.random().toString(36).substring(2, 34),
    audio: (Math.random() * 200 + 100).toFixed(14),
    screen_resolution: Math.random() > 0.5 ? "1920,1080" : "1366,768",
    available_screen_resolution: Math.random() > 0.5 ? "1920,1050" : "1366,728"
  };

  const deviceInfo = {
    screen_resolution: randomValues.screen_resolution,
    available_screen_resolution: randomValues.available_screen_resolution,
    system_version: "Linux x86_64",
    brand_model: "unknown",
    system_lang: "en-US",
    timezone: "GMT+00:00",
    timezoneOffset: 0,
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
}

async function testBinanceSquareDeduplication() {
  console.log('🔍 Testing Binance Square deduplication...');
  
  const allPosts = new Map(); // postId -> post data
  
  // Fetch from multiple pages
  for (let page = 1; page <= 3; page++) {
    const deviceInfo = generateDeviceInfo(); // Generate new device info for each request
    
    console.log(`\n📄 Fetching page ${page}...`);
    
    const body = JSON.stringify({
      pageIndex: page,
      pageSize: 50,
      scene: "web-homepage"
    });
    
    const options = {
      hostname: 'www.binance.com',
      path: '/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list',
      method: 'POST',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web',
        'device-info': deviceInfo,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
      
      if (response.data && response.data.vos) {
        const posts = response.data.vos;
        console.log(`📊 Page ${page}: ${posts.length} posts received`);
        
        let newPosts = 0;
        let duplicates = 0;
        
        posts.forEach(post => {
          const postId = post.id;
          if (allPosts.has(postId)) {
            duplicates++;
          } else {
            allPosts.set(postId, post);
            newPosts++;
          }
        });
        
        console.log(`✅ Page ${page}: ${newPosts} new posts, ${duplicates} duplicates`);
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
    }
  }
  
  console.log(`\n📈 Summary:`);
  console.log(`Total unique posts: ${allPosts.size}`);
  console.log(`Sample post IDs:`, Array.from(allPosts.keys()).slice(0, 5));
  
  // Check for author diversity
  const authors = new Set();
  allPosts.forEach(post => {
    if (post.authorName) {
      authors.add(post.authorName);
    }
  });
  
  console.log(`👥 Unique authors: ${authors.size}`);
  console.log(`Sample authors:`, Array.from(authors).slice(0, 5));
}

testBinanceSquareDeduplication().catch(console.error);
