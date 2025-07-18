// Test Binance News API directly
async function testBinanceNewsAPI() {
  console.log('🔍 Testing Binance News API directly...\n');
  
  const url = 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=50&strategy=6&tagId=0&featured=false';
  
  const headers = {
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
  };
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Error Response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success!');
    console.log('📊 Data structure:', Object.keys(data));
    
    if (data.data && data.data.vos) {
      console.log('📰 Found', data.data.vos.length, 'news articles');
      
      // Show first article
      if (data.data.vos.length > 0) {
        const first = data.data.vos[0];
        console.log('\n📝 First article:');
        console.log('  Title:', first.title);
        console.log('  Subtitle:', first.subTitle);
        console.log('  Date:', new Date(first.date * 1000).toISOString());
        console.log('  URL:', first.webLink);
      }
    } else {
      console.log('❌ No news articles found in response');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBinanceNewsAPI();
