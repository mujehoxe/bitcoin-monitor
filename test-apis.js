#!/usr/bin/env node

// Test script to check if the APIs work
async function testAPIs() {
  console.log('🧪 Testing API endpoints...');
  
  // Test RSS API
  try {
    const response = await fetch('http://localhost:3000/api/crypto-rss');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ RSS API working:', data.totalArticles, 'articles');
    } else {
      console.log('❌ RSS API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ RSS API error:', error.message);
  }
  
  // Test Social API
  try {
    const response = await fetch('http://localhost:3000/api/social-feeds');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Social API working:', data.totalArticles, 'articles');
    } else {
      console.log('❌ Social API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Social API error:', error.message);
  }
}

// Add delay to let server start
setTimeout(testAPIs, 5000);
