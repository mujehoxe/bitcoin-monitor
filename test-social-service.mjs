#!/usr/bin/env node

// Simple test to verify the social API service works
import { SocialAPIService } from './src/services/socialAPIService.js';

async function testSocialService() {
  console.log('🧪 Testing Social API Service...');
  
  const service = SocialAPIService.getInstance();
  
  try {
    const articles = await service.fetchAllFeeds();
    console.log(`✅ Social service working: ${articles.length} articles`);
    
    if (articles.length > 0) {
      console.log('Sample article:', {
        title: articles[0].title,
        source: articles[0].source,
        category: articles[0].category,
        author: articles[0].author
      });
    }
  } catch (error) {
    console.log('❌ Social service error:', error.message);
  }
}

testSocialService().catch(console.error);

export {};
