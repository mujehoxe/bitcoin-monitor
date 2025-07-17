#!/usr/bin/env node

// Test the complete flow: API call -> Social service -> filtered articles

async function testCompleteFlow() {
  console.log('🧪 Testing complete social feed flow...');
  
  // Test Binance Square API directly
  console.log('\n1. Testing Binance Square API directly...');
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

    if (!response.ok) {
      console.error('❌ Binance Square API failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ Binance Square API working');
    console.log('Response structure keys:', Object.keys(data));
    console.log('Data structure keys:', Object.keys(data.data || {}));
    console.log('Total feeds in response:', data.data?.feeds?.length || 0);
    console.log('Total vos in response:', data.data?.vos?.length || 0);
    
    // Check both possible structures
    const feeds = data.data?.feeds || data.data?.vos || [];
    console.log('Using feeds array, length:', feeds.length);
    
    // Analyze feed types
    const feedTypes = {};
    feeds.forEach(feed => {
      const cardType = feed.cardType || 'unknown';
      feedTypes[cardType] = (feedTypes[cardType] || 0) + 1;
    });
    
    console.log('Feed types:', feedTypes);
    
    // Filter for actual articles (like our service does)
    const articleFeeds = feeds.filter(item => {
      const cardType = item.cardType;
      return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
             (cardType && !cardType.includes('RECOMMEND') && 
              !cardType.includes('LIVE') && 
              !cardType.includes('GROUP'));
    });
    
    console.log('Filtered articles:', articleFeeds.length);
    
    if (articleFeeds.length > 0) {
      console.log('Sample article:');
      const sample = articleFeeds[0];
      console.log('- Title:', sample.title);
      console.log('- Author:', sample.authorName);
      console.log('- Date:', new Date(sample.date * 1000).toISOString());
      console.log('- Content preview:', (sample.content || sample.subTitle || '').substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error testing Binance Square API:', error.message);
  }
  
  // Test Binance News API
  console.log('\n2. Testing Binance News API directly...');
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

    if (!response.ok) {
      console.error('❌ Binance News API failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ Binance News API working');
    console.log('Total articles in response:', data.data?.vos?.length || 0);
    
    if (data.data?.vos && data.data.vos.length > 0) {
      console.log('Sample news article:');
      const sample = data.data.vos[0];
      console.log('- Title:', sample.title);
      console.log('- Author:', sample.authorName);
      console.log('- Date:', new Date(sample.date * 1000).toISOString());
      console.log('- Content preview:', (sample.subTitle || '').substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error testing Binance News API:', error.message);
  }
}

testCompleteFlow().catch(console.error);
