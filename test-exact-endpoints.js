// Test the exact curl commands provided
async function testExactEndpoints() {
  console.log('🔍 Testing exact Binance API endpoints...\n');
  
  // Test Binance News
  console.log('🧪 Testing Binance News...');
  try {
    const newsResponse = await fetch('https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=20&strategy=6&tagId=0&featured=false', {
      method: 'GET',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json'
      }
    });
    
    console.log(`📊 Binance News Status: ${newsResponse.status}`);
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      const articles = newsData.data?.vos || [];
      console.log(`✅ Binance News: ${articles.length} articles`);
      
      if (articles.length > 0) {
        console.log(`  First article: ${articles[0].title}`);
      }
    } else {
      const errorText = await newsResponse.text();
      console.log(`❌ Binance News Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Binance News Error:', error.message);
  }
  
  // Test Binance Square
  console.log('\n🧪 Testing Binance Square...');
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
        pageSize: 20,
        scene: "web-homepage"
      })
    });
    
    console.log(`📊 Binance Square Status: ${squareResponse.status}`);
    
    if (squareResponse.ok) {
      const squareData = await squareResponse.json();
      const feeds = squareData.data?.feeds || squareData.data?.vos || [];
      console.log(`✅ Binance Square: ${feeds.length} total items`);
      
      // Filter like in the service
      const articleFeeds = feeds.filter(item => {
        const cardType = item.cardType;
        if (!cardType) return false;
        
        const cardTypeStr = cardType.toString();
        const excludeTypes = ['KOL_RECOMMEND_GROUP', 'SPACE_LIVE', 'RECOMMEND_GROUP', 'ADVERTISEMENT', 'SPONSORED'];
        return !excludeTypes.some(exclude => cardTypeStr.includes(exclude));
      });
      
      console.log(`✅ Binance Square: ${articleFeeds.length} filtered articles`);
      
      if (articleFeeds.length > 0) {
        console.log(`  First article: ${articleFeeds[0].title || 'Binance Square Post'}`);
      }
    } else {
      const errorText = await squareResponse.text();
      console.log(`❌ Binance Square Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Binance Square Error:', error.message);
  }
}

testExactEndpoints();
