// Debug Binance Square filtering to see why we're only getting 5 articles
async function debugBinanceSquareFiltering() {
  console.log('🔍 Debugging Binance Square filtering...\n');
  
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
        pageSize: 50,  // Increase to 50 to get more articles
        scene: "web-homepage"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const feeds = data.data?.feeds || data.data?.vos || [];
      
      console.log(`📊 Total items received: ${feeds.length}`);
      
      // Show all card types to understand what we're filtering out
      const cardTypes = {};
      feeds.forEach((item, index) => {
        const cardType = item.cardType || 'unknown';
        cardTypes[cardType] = (cardTypes[cardType] || 0) + 1;
        
        if (index < 10) {
          console.log(`  ${index + 1}. ${cardType} - ${item.title || 'No title'}`);
        }
      });
      
      console.log('\n📊 All card types:');
      Object.entries(cardTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      // Test current filtering
      const currentFilter = feeds.filter(item => {
        const cardType = item.cardType;
        if (!cardType) return false;
        
        const cardTypeStr = cardType.toString();
        const excludeTypes = ['KOL_RECOMMEND_GROUP', 'SPACE_LIVE', 'RECOMMEND_GROUP', 'ADVERTISEMENT', 'SPONSORED'];
        return !excludeTypes.some(exclude => cardTypeStr.includes(exclude));
      });
      
      console.log(`\n✅ Current filter result: ${currentFilter.length} articles`);
      
      // Test even more permissive filtering - only exclude obvious spam
      const permissiveFilter = feeds.filter(item => {
        const cardType = item.cardType;
        if (!cardType) return false;
        
        const cardTypeStr = cardType.toString();
        // Only exclude very specific spam types
        const excludeTypes = ['KOL_RECOMMEND_GROUP', 'SPACE_LIVE'];
        return !excludeTypes.some(exclude => cardTypeStr.includes(exclude));
      });
      
      console.log(`✅ More permissive filter result: ${permissiveFilter.length} articles`);
      
      // Show which ones are being filtered out
      console.log('\n❌ Filtered out types:');
      feeds.forEach((item, index) => {
        const cardType = item.cardType;
        if (!cardType) return;
        
        const cardTypeStr = cardType.toString();
        const excludeTypes = ['KOL_RECOMMEND_GROUP', 'SPACE_LIVE', 'RECOMMEND_GROUP', 'ADVERTISEMENT', 'SPONSORED'];
        const isExcluded = excludeTypes.some(exclude => cardTypeStr.includes(exclude));
        
        if (isExcluded && index < 10) {
          console.log(`  ${cardType} - ${item.title || 'No title'}`);
        }
      });
      
    } else {
      console.error('❌ Request failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugBinanceSquareFiltering();
