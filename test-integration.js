#!/usr/bin/env node

// Final test of the implemented features
async function finalTest() {
  console.log('🎯 Final Integration Test...');
  
  const port = 3002;
  const baseUrl = `http://localhost:${port}`;
  
  // Test 1: Check if the main page loads
  try {
    const response = await fetch(`${baseUrl}/`);
    if (response.ok) {
      console.log('✅ Main page loads successfully');
    } else {
      console.log('❌ Main page failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Main page error:', error.message);
  }
  
  // Test 2: Check RSS API
  try {
    const response = await fetch(`${baseUrl}/api/crypto-rss`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ RSS API working: ${data.totalArticles} articles`);
      
      // Check if articles have categories
      if (data.articles && data.articles.length > 0) {
        const categorized = data.articles.filter(article => article.category);
        console.log(`📊 Categorized articles: ${categorized.length}/${data.articles.length}`);
      }
    } else {
      console.log('❌ RSS API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ RSS API error:', error.message);
  }
  
  // Test 3: Check Social API
  try {
    const response = await fetch(`${baseUrl}/api/social-feeds`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Social API working: ${data.totalArticles} articles`);
    } else {
      console.log('❌ Social API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Social API error:', error.message);
  }
  
  console.log('🎉 Integration test completed!');
}

// Wait for server to be ready
setTimeout(finalTest, 2000);
