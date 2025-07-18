// Simple test to check what's happening with filtering
async function testFiltering() {
  console.log('🔍 Testing Binance Square filtering...\n');
  
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
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
    
    if (response.ok) {
      const data = await response.json();
      const feeds = data.data?.feeds || data.data?.vos || [];
      
      console.log(`📊 Total items: ${feeds.length}`);
      
      // Show all card types
      console.log('\n📝 Card types:');
      const cardTypes = {};
      feeds.forEach((item, index) => {
        const cardType = item.cardType || 'unknown';
        cardTypes[cardType] = (cardTypes[cardType] || 0) + 1;
        
        if (index < 5) {
          console.log(`  ${index + 1}. ${cardType} - ${item.title || 'No title'}`);
        }
      });
      
      console.log('\n📊 Card type counts:');
      Object.entries(cardTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      // Test current filtering
      const currentFilter = feeds.filter(item => {
        const cardType = item.cardType;
        return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
               cardType === 'QUESTION' || cardType === 'POLL' ||
               (cardType && !cardType.toString().includes('RECOMMEND_GROUP') && 
                !cardType.toString().includes('SPACE_LIVE') && 
                !cardType.toString().includes('KOL_RECOMMEND_GROUP'));
      });
      
      console.log(`\n✅ Current filter result: ${currentFilter.length} articles`);
      
      // Test more permissive filtering
      const permissiveFilter = feeds.filter(item => {
        const cardType = item.cardType;
        // Only exclude obvious non-content types
        return cardType && 
               !cardType.includes('LIVE') && 
               !cardType.includes('RECOMMEND_GROUP') &&
               !cardType.includes('SPACE_LIVE') &&
               !cardType.includes('KOL_RECOMMEND_GROUP');
      });
      
      console.log(`✅ Permissive filter result: ${permissiveFilter.length} articles`);
      
    } else {
      console.error('❌ Request failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFiltering();
