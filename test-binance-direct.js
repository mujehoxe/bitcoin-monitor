#!/usr/bin/env node

// Test Binance APIs directly with exact headers from Postman

// Test function for Binance Square API
async function testBinanceSquare() {
  console.log('\n🔄 Testing Binance Square API...');
  
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
        pageSize: 20,
        scene: "web-homepage"
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Binance Square API Success!');
    console.log('Data structure:', Object.keys(data));
    
    if (data.data && data.data.feeds) {
      console.log('Number of feeds:', data.data.feeds.length);
      if (data.data.feeds.length > 0) {
        console.log('First feed sample:', JSON.stringify(data.data.feeds[0], null, 2));
      }
    } else {
      console.log('No feeds found in data structure');
      console.log('Full data structure:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Binance Square API Error:', error.message);
  }
}

// Test function for Binance News API
async function testBinanceNews() {
  console.log('\n🔄 Testing Binance News API...');
  
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=20&strategy=6&tagId=0&featured=false', {
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

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Binance News API Success!');
    console.log('Data structure:', Object.keys(data));
    
    if (data.data && data.data.vos) {
      console.log('Number of articles:', data.data.vos.length);
      console.log('First article sample:', JSON.stringify(data.data.vos[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Binance News API Error:', error.message);
  }
}

// Test function with curl-like approach
async function testWithCurl() {
  console.log('\n🔄 Testing with curl-like approach...');
  
  const curlCommand = `curl -X POST 'https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list' \\
  -H 'clienttype: web' \\
  -H 'content-type: application/json' \\
  -H 'versioncode: web' \\
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' \\
  -H 'Accept: application/json, text/plain, */*' \\
  -H 'Accept-Language: en-US,en;q=0.9' \\
  -H 'Cache-Control: no-cache' \\
  -H 'Origin: https://www.binance.com' \\
  -H 'Referer: https://www.binance.com/' \\
  -H 'Sec-Fetch-Dest: empty' \\
  -H 'Sec-Fetch-Mode: cors' \\
  -H 'Sec-Fetch-Site: same-origin' \\
  -d '{"pageIndex":1,"pageSize":20,"scene":"web-homepage"}'`;
  
  console.log('Equivalent curl command:');
  console.log(curlCommand);
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Binance API Integration...');
  
  await testBinanceSquare();
  await testBinanceNews();
  await testWithCurl();
  
  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
