#!/usr/bin/env node

// Simple test of the API endpoint
console.log('🧪 Testing social API endpoint...');

async function testEndpoint() {
  try {
    console.log('📡 Testing social feeds API endpoint...');
    
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/social-feeds?refresh=true');
    
    if (!response.ok) {
      console.error('❌ Social feeds API failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Social feeds API working');
    console.log('Total articles returned:', data.totalArticles || 0);
    console.log('Articles array length:', data.articles?.length || 0);
    
    // Categorize articles
    const categories = {};
    if (data.articles) {
      data.articles.forEach(article => {
        const category = article.category || 'uncategorized';
        categories[category] = (categories[category] || 0) + 1;
      });
    }
    
    console.log('Articles by category:', categories);
    
    // Show sample articles
    if (data.articles && data.articles.length > 0) {
      console.log('\n📝 Sample articles:');
      data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Source: ${article.source}`);
        console.log(`   Category: ${article.category}`);
        console.log(`   Author: ${article.author}`);
        console.log(`   Published: ${article.publishedAt}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Description: ${(article.description || '').substring(0, 100)}...`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing social feeds API:', error.message);
  }
}

testEndpoint().catch(console.error);
