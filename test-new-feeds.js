// Test new feeds added to the CSV
const https = require('https');
const http = require('http');

const newFeeds = [
  // News sites
  'https://www.coindesk.com/feed/',
  'https://beincrypto.com/feed/',
  'https://ambcrypto.com/feed/',
  'https://cryptonews.com/feed/',
  'https://cryptoslate.com/feed/',
  'https://u.today/rss/',
  
  // Reddit feeds
  'https://www.reddit.com/r/CryptoCurrency/.rss',
  'https://www.reddit.com/r/Bitcoin/.rss',
  'https://www.reddit.com/r/ethereum/.rss',
  
  // YouTube feeds (these should return video feeds)
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCRvqjQPSeaWn-uEx-w0XOIg',
  'https://www.youtube.com/feeds/videos.xml?channel_id=UC-lHJZR3Gqxm24_Vd_AJ5Yw'
];

async function testFeed(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`🔍 Testing: ${url}`);
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      const status = res.statusCode;
      console.log(`   Status: ${status}`);
      
      if (status === 200) {
        console.log(`   ✅ Working!`);
      } else if (status === 301 || status === 302) {
        console.log(`   ⚠️  Redirect to: ${res.headers.location}`);
      } else {
        console.log(`   ❌ Error: ${status}`);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Content Length: ${data.length}`);
        resolve({ url, status, length: data.length });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Network Error: ${error.message}`);
      resolve({ url, error: error.message });
    });
    
    req.setTimeout(8000, () => {
      req.abort();
      console.log(`   ❌ Timeout`);
      resolve({ url, error: 'Timeout' });
    });
  });
}

async function testNewFeeds() {
  console.log('🧪 Testing newly added feeds...\n');
  
  const results = [];
  
  for (const feed of newFeeds) {
    const result = await testFeed(feed);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 Summary:');
  const working = results.filter(r => !r.error && r.status === 200);
  const failing = results.filter(r => r.error || r.status !== 200);
  
  console.log(`✅ Working feeds: ${working.length}`);
  console.log(`❌ Failing feeds: ${failing.length}`);
  
  if (failing.length > 0) {
    console.log('\n❌ Failing feeds:');
    failing.forEach(f => {
      console.log(`   - ${f.url} (${f.error || f.status})`);
    });
  }
}

testNewFeeds().catch(console.error);
