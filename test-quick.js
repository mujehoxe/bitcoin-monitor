#!/usr/bin/env node

// Quick test to verify the updated social API service works correctly
console.log('🔧 Testing updated social API service...');

async function quickTest() {
  try {
    // Test the most basic Binance Square API call
    console.log('\n📡 Testing Binance Square API call...');
    
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
      console.error('❌ API failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ API call successful');
    
    // Check response structure
    const feeds = data.data?.feeds || data.data?.vos || [];
    console.log('📊 Found', feeds.length, 'total feeds');
    
    // Count by type
    const byType = {};
    feeds.forEach(feed => {
      const type = feed.cardType || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });
    console.log('📈 By type:', byType);
    
    // Filter articles
    const articles = feeds.filter(item => {
      const cardType = item.cardType;
      return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
             (cardType && !cardType.includes('RECOMMEND') && 
              !cardType.includes('LIVE') && 
              !cardType.includes('GROUP'));
    });
    
    console.log('📰 Filtered articles:', articles.length);
    
    // Show first article details
    if (articles.length > 0) {
      const first = articles[0];
      console.log('\n📄 First article sample:');
      console.log('- Title:', first.title || 'Binance Square Post');
      console.log('- Author:', first.authorName);
      console.log('- Type:', first.cardType);
      console.log('- Views:', first.viewCount || 0);
      console.log('- Likes:', first.likeCount || 0);
      console.log('- Comments:', first.commentCount || 0);
      console.log('- Shares:', first.shareCount || 0);
      console.log('- Quotes:', first.quoteCount || 0);
    }
    
    // Test if increasing pageSize helps
    console.log('\n🔍 Testing with increased pageSize...');
    const largerResponse = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
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
        pageSize: 100,  // Much larger
        scene: "web-homepage"
      })
    });

    if (largerResponse.ok) {
      const largerData = await largerResponse.json();
      const largerFeeds = largerData.data?.feeds || largerData.data?.vos || [];
      const largerArticles = largerFeeds.filter(item => {
        const cardType = item.cardType;
        return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
               (cardType && !cardType.includes('RECOMMEND') && 
                !cardType.includes('LIVE') && 
                !cardType.includes('GROUP'));
      });
      
      console.log('📊 With pageSize=100:');
      console.log('- Total feeds:', largerFeeds.length);
      console.log('- Article feeds:', largerArticles.length);
      
      // Analyze if we're getting more varied content
      const largerByType = {};
      largerFeeds.forEach(feed => {
        const type = feed.cardType || 'unknown';
        largerByType[type] = (largerByType[type] || 0) + 1;
      });
      console.log('- By type:', largerByType);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest().catch(console.error);
