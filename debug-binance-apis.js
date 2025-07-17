#!/usr/bin/env node

// Debug the Binance API responses
async function debugBinanceAPIs() {
  console.log('🔍 Debugging Binance API responses...');
  
  // Test Binance Square API
  console.log('\n=== Binance Square API ===');
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
      method: 'POST',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Origin': 'https://www.binance.com',
        'Referer': 'https://www.binance.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      body: JSON.stringify({
        pageIndex: 1,
        pageSize: 5,
        scene: "web-homepage"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response structure:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test Binance News API
  console.log('\n=== Binance News API ===');
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=5&strategy=6&tagId=0&featured=false', {
      method: 'GET',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Origin': 'https://www.binance.com',
        'Referer': 'https://www.binance.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response structure:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugBinanceAPIs().catch(console.error);
