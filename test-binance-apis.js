#!/usr/bin/env node

// Test the updated social API service
async function testSocialAPI() {
  console.log('🧪 Testing Social API Service with updated headers...');
  
  // Test Binance Square API
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
      console.log('✅ Binance Square API working:', data?.data?.feeds?.length || 0, 'posts');
      if (data?.data?.feeds?.length > 0) {
        console.log('Sample post:', data.data.feeds[0].title || 'No title');
      }
    } else {
      console.log('❌ Binance Square API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Binance Square API error:', error.message);
  }
  
  // Test Binance News API
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
      console.log('✅ Binance News API working:', data?.data?.catalogs?.length || 0, 'catalogs');
      if (data?.data?.catalogs?.length > 0) {
        const firstCatalog = data.data.catalogs[0];
        console.log('Sample catalog:', firstCatalog.articles?.length || 0, 'articles');
      }
    } else {
      console.log('❌ Binance News API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Binance News API error:', error.message);
  }
}

testSocialAPI().catch(console.error);
