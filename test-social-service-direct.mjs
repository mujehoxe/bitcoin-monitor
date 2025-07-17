#!/usr/bin/env node

// Test the social API service directly
async function testSocialAPIService() {
  // Import the service (we need to use dynamic import for ES modules)
  const { SocialAPIService } = await import('./src/services/socialAPIService.js');
  
  console.log('🧪 Testing Social API Service directly...');
  
  const service = SocialAPIService.getInstance();
  
  try {
    const articles = await service.fetchAllFeeds();
    console.log(`✅ Social API Service working: ${articles.length} articles`);
    
    if (articles.length > 0) {
      console.log('\n📰 Sample articles:');
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.source}) - ${article.category}`);
        console.log(`   ${article.description.substring(0, 100)}...`);
        console.log(`   Published: ${article.publishedAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Social API Service error:', error.message);
  }
}

testSocialAPIService().catch(console.error);
