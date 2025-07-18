// Test different page sizes and parameters for Binance Square
const https = require('https');
const zlib = require('zlib');

function testBinanceSquareParams(pageSize, pageIndex = 1) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing Binance Square with pageSize=${pageSize}, pageIndex=${pageIndex}...`);
    
    const postData = JSON.stringify({
      pageIndex: pageIndex,
      pageSize: pageSize,
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
      let stream = res;
      
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
          console.log(`✅ PageSize ${pageSize}, Page ${pageIndex}: ${feeds.length} items`);
          
          if (feeds.length > 0) {
            const cardTypes = {};
            feeds.forEach(item => {
              const cardType = item.cardType || 'unknown';
              cardTypes[cardType] = (cardTypes[cardType] || 0) + 1;
            });
            
            console.log(`   Card types: ${Object.entries(cardTypes).map(([type, count]) => `${type}:${count}`).join(', ')}`);
          }
          
          resolve(feeds.length);
        } catch (error) {
          console.error(`❌ Parse error for pageSize ${pageSize}:`, error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Request error for pageSize ${pageSize}:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`❌ Request timeout for pageSize ${pageSize}`);
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

async function testDifferentParams() {
  console.log('🚀 Testing different parameters for Binance Square...\n');
  
  // Test different page sizes
  const pageSizes = [10, 20, 50, 100];
  
  for (const pageSize of pageSizes) {
    try {
      await testBinanceSquareParams(pageSize);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    } catch (error) {
      console.error(`Failed to test pageSize ${pageSize}`);
    }
  }
  
  // Test different pages
  console.log('\n🔄 Testing different pages with pageSize=20...');
  for (let page = 1; page <= 3; page++) {
    try {
      await testBinanceSquareParams(20, page);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    } catch (error) {
      console.error(`Failed to test page ${page}`);
    }
  }
}

testDifferentParams();
