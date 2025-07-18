// Simple test to check if the issue is with our service or the external API
const https = require('https');
const zlib = require('zlib');

function testBinanceSquareSimple() {
  console.log('🔍 Testing Binance Square with simple HTTP request...');
  
  const postData = JSON.stringify({
    pageIndex: 1,
    pageSize: 50,
    scene: "web-homepage"
  });
  
  const options = {
    hostname: 'www.binance.com',
    port: 443,
    path: '/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list',
    method: 'POST',
    headers: {
      'clienttype': 'web',
      'content-type': 'application/json',
      'versioncode': 'web',
      'Content-Length': postData.length,
      'Accept-Encoding': 'gzip, deflate'
    },
    timeout: 10000
  };
  
  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let stream = res;
    
    // Handle gzip compression
    if (res.headers['content-encoding'] === 'gzip') {
      stream = res.pipe(zlib.createGunzip());
    } else if (res.headers['content-encoding'] === 'deflate') {
      stream = res.pipe(zlib.createInflate());
    }
    
    let data = '';
    stream.on('data', (chunk) => {
      data += chunk;
    });
    
    stream.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const feeds = parsed.data?.feeds || parsed.data?.vos || [];
        console.log(`✅ Received ${feeds.length} items`);
        
        if (feeds.length > 0) {
          console.log('📝 Sample items:');
          feeds.slice(0, 5).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.cardType} - ${item.title || 'No title'}`);
          });
          
          // Show card types
          const cardTypes = {};
          feeds.forEach(item => {
            const cardType = item.cardType || 'unknown';
            cardTypes[cardType] = (cardTypes[cardType] || 0) + 1;
          });
          
          console.log('\n📊 Card types:');
          Object.entries(cardTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });
        }
      } catch (error) {
        console.error('❌ Parse error:', error.message);
        console.log('Raw data (first 200 chars):', data.substring(0, 200));
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
  
  req.on('timeout', () => {
    console.error('❌ Request timeout');
    req.destroy();
  });
  
  req.write(postData);
  req.end();
}

testBinanceSquareSimple();
