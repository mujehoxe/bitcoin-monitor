// Test Binance News API directly
const https = require('https');

function testBinanceNews() {
  console.log('🔍 Testing Binance News API...');
  
  const options = {
    hostname: 'www.binance.com',
    port: 443,
    path: '/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=50&strategy=6&tagId=0&featured=false',
    method: 'GET',
    headers: {
      'clienttype': 'web',
      'content-type': 'application/json'
    },
    timeout: 10000
  };
  
  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('📊 Response keys:', Object.keys(parsed));
        
        if (parsed.data && parsed.data.vos) {
          console.log(`✅ Found ${parsed.data.vos.length} news articles`);
          
          if (parsed.data.vos.length > 0) {
            console.log('📝 First article:', parsed.data.vos[0].title);
          }
        } else {
          console.log('❌ No news articles found in response');
          console.log('📊 Response structure:', JSON.stringify(parsed, null, 2));
        }
      } catch (error) {
        console.error('❌ Parse error:', error.message);
        console.log('Raw response:', data.substring(0, 500));
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
  
  req.end();
}

testBinanceNews();
