#!/usr/bin/env node

// Test the updated social API service with both Binance endpoints
async function testBinanceAPIs() {
  console.log('🧪 Testing Binance APIs with corrected parsing...');
  
  try {
    // Test Binance Square API
    console.log('\n1. Testing Binance Square API...');
    const squareResponse = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
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

    if (!squareResponse.ok) {
      console.error('❌ Binance Square API failed:', squareResponse.status, squareResponse.statusText);
      return;
    }

    const squareData = await squareResponse.json();
    
    // Use the corrected parsing logic
    const feeds = squareData.data?.feeds || squareData.data?.vos || [];
    console.log('✅ Binance Square API working');
    console.log('Total feeds:', feeds.length);
    
    // Filter for actual articles
    const articleFeeds = feeds.filter(item => {
      const cardType = item.cardType;
      return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
             (cardType && !cardType.includes('RECOMMEND') && 
              !cardType.includes('LIVE') && 
              !cardType.includes('GROUP'));
    });
    
    console.log('Article feeds after filtering:', articleFeeds.length);
    
    if (articleFeeds.length > 0) {
      console.log('Sample Square article:');
      const sample = articleFeeds[0];
      console.log('- Title:', sample.title || 'Binance Square Post');
      console.log('- Author:', sample.authorName);
      console.log('- Date:', new Date(sample.date * 1000).toISOString());
      console.log('- Content preview:', (sample.content || sample.subTitle || '').substring(0, 100) + '...');
    }
    
    // Test Binance News API
    console.log('\n2. Testing Binance News API...');
    const newsResponse = await fetch('https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=20&strategy=6&tagId=0&featured=false', {
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

    if (!newsResponse.ok) {
      console.error('❌ Binance News API failed:', newsResponse.status, newsResponse.statusText);
      return;
    }

    const newsData = await newsResponse.json();
    console.log('✅ Binance News API working');
    console.log('Total news articles:', newsData.data?.vos?.length || 0);
    
    if (newsData.data?.vos && newsData.data.vos.length > 0) {
      console.log('Sample News article:');
      const sample = newsData.data.vos[0];
      console.log('- Title:', sample.title);
      console.log('- Author:', sample.authorName);
      console.log('- Date:', new Date(sample.date * 1000).toISOString());
      console.log('- Content preview:', (sample.subTitle || '').substring(0, 100) + '...');
    }
    
    console.log('\n📊 Summary:');
    console.log('- Binance Square articles available:', articleFeeds.length);
    console.log('- Binance News articles available:', newsData.data?.vos?.length || 0);
    console.log('- Total articles from both APIs:', articleFeeds.length + (newsData.data?.vos?.length || 0));
    
  } catch (error) {
    console.error('❌ Error testing Binance APIs:', error.message);
  }
}

testBinanceAPIs().catch(console.error);
