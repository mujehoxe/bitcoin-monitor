// Test current API endpoints
async function testAPIs() {
  console.log('🔍 Testing current API endpoints...\n');
  
  // Test RSS API
  try {
    console.log('📡 Testing /api/crypto-rss...');
    const rssResponse = await fetch('http://localhost:3000/api/crypto-rss');
    const rssData = await rssResponse.json();
    console.log(`✅ RSS API: ${rssData.articles?.length || 0} articles`);
    
    // Check for specific sources
    const sources = {};
    rssData.articles?.forEach(article => {
      sources[article.source] = (sources[article.source] || 0) + 1;
    });
    
    console.log('\n📊 RSS Sources:');
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} articles`);
    });
    
    // Check for problematic feeds
    const problematicFeeds = ['cointelegraph', 'newsbtc', 'btcmanager', 'cryptodaily'];
    problematicFeeds.forEach(feed => {
      const found = rssData.articles?.some(article => 
        article.source.toLowerCase().includes(feed)
      );
      console.log(`${found ? '✅' : '❌'} ${feed} articles found`);
    });
    
  } catch (error) {
    console.error('❌ RSS API Error:', error.message);
  }
  
  // Test Social API
  try {
    console.log('\n📡 Testing /api/social-feeds...');
    const socialResponse = await fetch('http://localhost:3000/api/social-feeds');
    const socialData = await socialResponse.json();
    console.log(`✅ Social API: ${socialData.articles?.length || 0} articles`);
    
    if (socialData.articles) {
      socialData.articles.forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title} (${article.source})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Social API Error:', error.message);
  }
}

// Run the test
testAPIs().catch(console.error);
