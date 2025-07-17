// Test specific feeds to see what's happening
const https = require('https');
const http = require('http');

const problematicFeeds = [
  'https://www.binance.com/en/feed/news/all',
  'https://cryptopotato.com/feed',
  'https://coinjournal.net/feed/',
  'https://decrypt.co/feed',
  'https://bitcoinmagazine.com/feed'
];

const workingFeeds = [
  'https://cointelegraph.com/feed',
  'https://news.bitcoin.com/feed/',
  'https://www.newsbtc.com/feed/',
  'https://blog.coinbase.com/feed'
];

async function testFeed(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`\n🔍 Testing: ${url}`);
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Content Length: ${data.length}`);
        console.log(`   Content Preview: ${data.substring(0, 200)}...`);
        resolve({ url, status: res.statusCode, length: data.length, preview: data.substring(0, 200) });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   Error: ${error.message}`);
      resolve({ url, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      console.log(`   Timeout after 10 seconds`);
      resolve({ url, error: 'Timeout' });
    });
  });
}

async function testAllFeeds() {
  console.log('🧪 Testing problematic feeds...');
  
  for (const feed of problematicFeeds) {
    await testFeed(feed);
  }
  
  console.log('\n✅ Testing working feeds for comparison...');
  
  for (const feed of workingFeeds) {
    await testFeed(feed);
  }
}

testAllFeeds().catch(console.error);
