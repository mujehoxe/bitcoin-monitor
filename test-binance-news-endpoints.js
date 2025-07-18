// Test Binance News API endpoints
async function testBinanceNewsEndpoints() {
  console.log('🔍 Testing Binance News API endpoints...\n');
  
  // Test different possible endpoints for Binance News
  const testEndpoints = [
    // Current simplified endpoint that worked
    {
      name: 'Current working endpoint',
      url: 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=10',
      method: 'GET'
    },
    // Try with POST like Square
    {
      name: 'POST with body',
      url: 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list',
      method: 'POST',
      body: JSON.stringify({
        pageIndex: 1,
        pageSize: 50
      })
    },
    // Try v8 like Square
    {
      name: 'v8 endpoint',
      url: 'https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/news/list?pageIndex=1&pageSize=50',
      method: 'GET'
    }
  ];
  
  const headers = {
    'clienttype': 'web',
    'content-type': 'application/json',
    'versioncode': 'web'
  };
  
  for (const endpoint of testEndpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`📡 URL: ${endpoint.url}`);
    console.log(`📡 Method: ${endpoint.method}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: headers,
        body: endpoint.body
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        
        if (data.data && data.data.vos) {
          console.log(`📰 Found ${data.data.vos.length} news articles`);
          
          // Show first article
          if (data.data.vos.length > 0) {
            const first = data.data.vos[0];
            console.log(`  First article: ${first.title}`);
          }
        } else {
          console.log('📊 Response structure:', Object.keys(data));
        }
      } else {
        const text = await response.text();
        console.log('❌ Error:', text.substring(0, 200));
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testBinanceNewsEndpoints();
