// Test the social API service directly
async function testSocialService() {
  console.log('🔍 Testing Social API Service directly...\n');
  
  // Import the service
  const { SocialAPIService } = require('./src/services/socialAPIService.ts');
  
  try {
    const service = SocialAPIService.getInstance();
    const articles = await service.fetchAllFeeds();
    
    console.log(`📰 Total articles: ${articles.length}`);
    
    // Group by source
    const bySource = {};
    articles.forEach(article => {
      bySource[article.source] = (bySource[article.source] || 0) + 1;
    });
    
    console.log('\n📊 Articles by source:');
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
    
    // Show sample articles
    console.log('\n📝 Sample articles:');
    articles.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.source})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSocialService();
