// Test Binance News API with different parameters
async function testBinanceNewsVariations() {
  console.log('🔍 Testing Binance News API with different parameters...\n');
  
  // Test different endpoints and parameters
  const testCases = [
    {
      name: 'Current endpoint',
      url: 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=50&strategy=6&tagId=0&featured=false',
      method: 'GET'
    },
    {
      name: 'Simplified endpoint',
      url: 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=10',
      method: 'GET'
    },
    {
      name: 'Alternative endpoint',
      url: 'https://www.binance.com/bapi/composite/v1/friendly/pgc/feed/news/list',
      method: 'GET'
    }
  ];
  
  const headers = {
    'clienttype': 'web',
    'versioncode': 'web',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Origin': 'https://www.binance.com',
    'Referer': 'https://www.binance.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
  };
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📡 URL: ${testCase.url}`);
    
    try {
      const response = await fetch(testCase.url, {
        method: testCase.method,
        headers: headers
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        if (data.data && data.data.vos) {
          console.log(`📰 Found ${data.data.vos.length} news articles`);
        } else {
          console.log('📊 Response keys:', Object.keys(data));
        }
      } else {
        const text = await response.text();
        console.log('❌ Error:', text);
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testBinanceNewsVariations();
