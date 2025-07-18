#!/usr/bin/env node

// Test the updated social API service with engagement metrics
console.log('🧪 Testing updated social API with engagement metrics...');

async function testWithEngagementMetrics() {
  try {
    // Test Binance Square API
    console.log('\n1. Testing Binance Square API with engagement metrics...');
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
    
    // Analyze all feed types
    const feedTypes = {};
    feeds.forEach(feed => {
      const cardType = feed.cardType || 'unknown';
      feedTypes[cardType] = (feedTypes[cardType] || 0) + 1;
    });
    console.log('All feed types:', feedTypes);
    
    // Filter for actual articles
    const articleFeeds = feeds.filter(item => {
      const cardType = item.cardType;
      return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
             (cardType && !cardType.includes('RECOMMEND') && 
              !cardType.includes('LIVE') && 
              !cardType.includes('GROUP'));
    });
    
    console.log('Article feeds after filtering:', articleFeeds.length);
    
    // Show detailed info for each article
    articleFeeds.forEach((article, index) => {
      console.log(`\n📄 Article ${index + 1}:`);
      console.log('- Title:', article.title || 'Binance Square Post');
      console.log('- Author:', article.authorName);
      console.log('- CardType:', article.cardType);
      console.log('- Date:', new Date(article.date * 1000).toISOString());
      console.log('- Views:', article.viewCount || 0);
      console.log('- Likes:', article.likeCount || 0);
      console.log('- Comments:', article.commentCount || 0);
      console.log('- Shares:', article.shareCount || 0);
      console.log('- Quotes:', article.quoteCount || 0);
      console.log('- Content preview:', (article.content || article.subTitle || '').substring(0, 100) + '...');
      console.log('- URL:', article.webLink);
    });

    // Test with different pageSize to get more articles
    console.log('\n2. Testing Binance Square API with larger page size...');
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
        pageSize: 50,  // Increase page size
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
      
      console.log('✅ Larger page size test:');
      console.log('- Total feeds with pageSize=50:', largerFeeds.length);
      console.log('- Article feeds with pageSize=50:', largerArticles.length);
    }

    // Test with different scene parameter
    console.log('\n3. Testing Binance Square API with different scene...');
    const differentSceneResponse = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
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
        pageSize: 30,
        scene: "web-feed"  // Different scene
      })
    });

    if (differentSceneResponse.ok) {
      const differentSceneData = await differentSceneResponse.json();
      const differentSceneFeeds = differentSceneData.data?.feeds || differentSceneData.data?.vos || [];
      const differentSceneArticles = differentSceneFeeds.filter(item => {
        const cardType = item.cardType;
        return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
               (cardType && !cardType.includes('RECOMMEND') && 
                !cardType.includes('LIVE') && 
                !cardType.includes('GROUP'));
      });
      
      console.log('✅ Different scene test:');
      console.log('- Total feeds with scene="web-feed":', differentSceneFeeds.length);
      console.log('- Article feeds with scene="web-feed":', differentSceneArticles.length);
    }
    
  } catch (error) {
    console.error('❌ Error testing Binance APIs:', error.message);
  }
}

testWithEngagementMetrics().catch(console.error);
