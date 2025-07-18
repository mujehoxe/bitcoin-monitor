// Simple test to verify our enhanced social API changes work
async function testSocialAPIEndpoint() {
  console.log('🔍 Testing Social API Endpoint...');
  
  try {
    // Test the social feeds endpoint
    console.log('📡 Fetching from /api/social-feeds...');
    const response = await fetch('http://localhost:3000/api/social-feeds');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Response received');
    console.log(`📊 Total articles: ${data.totalArticles || 0}`);
    console.log(`📊 Articles array length: ${data.articles?.length || 0}`);
    
    // Check for Binance Square articles
    const binanceSquareArticles = data.articles?.filter(article => 
      article.source === 'Binance Square'
    ) || [];
    
    console.log(`📊 Binance Square articles: ${binanceSquareArticles.length}`);
    
    // Sample engagement metrics
    if (binanceSquareArticles.length > 0) {
      console.log('\n📊 Sample engagement metrics:');
      binanceSquareArticles.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.author})`);
        console.log(`   Views: ${article.engagementMetrics?.viewCount || 0}`);
        console.log(`   Likes: ${article.engagementMetrics?.likeCount || 0}`);
        console.log(`   Comments: ${article.engagementMetrics?.commentCount || 0}`);
      });
      
      // Check for author diversity
      const authors = new Set(binanceSquareArticles.map(a => a.author));
      console.log(`👥 Unique authors: ${authors.size}`);
      
      // Check post IDs for deduplication
      const postIds = new Set();
      binanceSquareArticles.forEach(article => {
        if (article.id.includes('binance-square-')) {
          const parts = article.id.split('-');
          if (parts.length >= 3) {
            postIds.add(parts[2]);
          }
        }
      });
      
      console.log(`🔄 Unique post IDs: ${postIds.size}`);
      console.log(`📊 Deduplication ratio: ${binanceSquareArticles.length}/${postIds.size} = ${(binanceSquareArticles.length / postIds.size).toFixed(2)}`);
      
      if (binanceSquareArticles.length === postIds.size) {
        console.log('✅ Perfect deduplication - no duplicates found!');
      } else {
        console.log('⚠️ Some duplicates may still exist');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing social API endpoint:', error.message);
  }
  
  console.log('\n✅ Social API endpoint test completed!');
}

testSocialAPIEndpoint();
