// Test Binance alternatives since their main feed is blocked
const https = require('https');

const binanceAlternatives = [
  'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20',
  'https://www.binance.com/blog/feed',
  'https://academy.binance.com/feed',
  'https://research.binance.com/feed'
];

async function testBinanceAlternatives() {
  console.log('🧪 Testing Binance alternatives...\n');
  
  for (const url of binanceAlternatives) {
    console.log(`🔍 Testing: ${url}`);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          }
        }, (res) => {
          console.log(`📊 Status: ${res.statusCode}`);
          console.log(`📋 Content-Type: ${res.headers['content-type']}`);
          
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`📄 Response length: ${data.length} bytes`);
            if (data.length > 0) {
              console.log(`📝 First 200 chars: ${data.substring(0, 200)}...`);
            }
            resolve({ status: res.statusCode, data, headers: res.headers });
          });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.abort();
          reject(new Error('Timeout'));
        });
      });
      
      if (response.status === 200) {
        console.log('✅ Working alternative found!');
      } else {
        console.log(`❌ Status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

testBinanceAlternatives().catch(console.error);
