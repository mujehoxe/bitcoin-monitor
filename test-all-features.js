#!/usr/bin/env node

// Comprehensive test of all features
async function testAllFeatures() {
  console.log('🎯 Testing All Features...');
  
  const port = 3003;
  const baseUrl = `http://localhost:${port}`;
  
  // Test 1: RSS API
  console.log('\n=== Testing RSS API ===');
  try {
    const response = await fetch(`${baseUrl}/api/crypto-rss`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ RSS API: ${data.totalArticles} articles`);
      
      // Check categories
      if (data.articles && data.articles.length > 0) {
        const categories = {};
        data.articles.forEach(article => {
          categories[article.category] = (categories[article.category] || 0) + 1;
        });
        console.log('📊 RSS Categories:', categories);
      }
    } else {
      console.log('❌ RSS API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ RSS API error:', error.message);
  }
  
  // Test 2: Social API
  console.log('\n=== Testing Social API ===');
  try {
    const response = await fetch(`${baseUrl}/api/social-feeds`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Social API: ${data.totalArticles} articles`);
      
      // Check categories
      if (data.articles && data.articles.length > 0) {
        const categories = {};
        data.articles.forEach(article => {
          categories[article.category] = (categories[article.category] || 0) + 1;
        });
        console.log('📊 Social Categories:', categories);
        
        // Sample articles
        console.log('\n📰 Sample social articles:');
        data.articles.slice(0, 3).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title} (${article.source})`);
          console.log(`   Category: ${article.category}`);
          console.log(`   Author: ${article.author}`);
          console.log(`   Description: ${article.description.substring(0, 100)}...`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Social API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Social API error:', error.message);
  }
  
  // Test 3: Combined categorization
  console.log('\n=== Testing Combined Categorization ===');
  try {
    const [rssResponse, socialResponse] = await Promise.all([
      fetch(`${baseUrl}/api/crypto-rss`),
      fetch(`${baseUrl}/api/social-feeds`)
    ]);
    
    const allArticles = [];
    
    if (rssResponse.ok) {
      const rssData = await rssResponse.json();
      allArticles.push(...(rssData.articles || []));
    }
    
    if (socialResponse.ok) {
      const socialData = await socialResponse.json();
      allArticles.push(...(socialData.articles || []));
    }
    
    if (allArticles.length > 0) {
      const categories = {};
      allArticles.forEach(article => {
        categories[article.category] = (categories[article.category] || 0) + 1;
      });
      
      console.log(`📊 Total articles: ${allArticles.length}`);
      console.log('📊 Combined Categories:', categories);
      
      // Expected categories should have counts > 0
      const expectedCategories = ['news', 'blog', 'magazine', 'social', 'analysis'];
      const hasData = expectedCategories.some(cat => categories[cat] > 0);
      
      if (hasData) {
        console.log('✅ Categorization working correctly!');
      } else {
        console.log('⚠️ Some categories may be empty');
      }
    }
  } catch (error) {
    console.log('❌ Combined test error:', error.message);
  }
  
  console.log('\n🎉 Feature testing completed!');
}

// Wait for server to be ready
setTimeout(() => {
  testAllFeatures().catch(console.error);
}, 5000);
