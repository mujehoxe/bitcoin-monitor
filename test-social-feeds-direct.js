// Test social feeds with the exact working configuration
async function testSocialFeeds() {
  console.log('🔍 Testing social feeds with exact working configuration...\n');
  
  // Test Binance Square
  console.log('🧪 Testing Binance Square...');
  try {
    const squareResponse = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
      method: 'POST',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web'
      },
      body: JSON.stringify({
        pageIndex: 1,
        pageSize: 50,
        scene: "web-homepage"
      })
    });
    
    if (squareResponse.ok) {
      const squareData = await squareResponse.json();
      const feeds = squareData.data?.feeds || squareData.data?.vos || [];
      console.log(`✅ Binance Square: ${feeds.length} total items`);
      
      // Filter content like in the service
      const articleFeeds = feeds.filter(item => {
        const cardType = item.cardType;
        return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
               cardType === 'QUESTION' || cardType === 'POLL' ||
               (cardType && !cardType.toString().includes('RECOMMEND_GROUP') && 
                !cardType.toString().includes('SPACE_LIVE') && 
                !cardType.toString().includes('KOL_RECOMMEND_GROUP'));
      });
      
      console.log(`📰 Binance Square: ${articleFeeds.length} filtered articles`);
      
      // Show card types
      const cardTypes = {};
      feeds.forEach(item => {
        const cardType = item.cardType || 'unknown';
        cardTypes[cardType] = (cardTypes[cardType] || 0) + 1;
      });
      
      console.log('📊 Card types:', cardTypes);
      
    } else {
      console.error('❌ Binance Square failed:', squareResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Binance Square error:', error.message);
  }
  
  // Test Binance News
  console.log('\n🧪 Testing Binance News...');
  try {
    const newsResponse = await fetch('https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=50', {
      method: 'GET',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web'
      }
    });
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      const articles = newsData.data?.vos || [];
      console.log(`✅ Binance News: ${articles.length} articles`);
      
      if (articles.length > 0) {
        console.log(`📝 First article: ${articles[0].title}`);
      }
    } else {
      console.error('❌ Binance News failed:', newsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Binance News error:', error.message);
  }
}

testSocialFeeds();
