#!/usr/bin/env node

// Test the complete pipeline: Social API service -> Articles
console.log('🧪 Testing complete social API pipeline...');

// Since we can't directly import the TypeScript service, let's test via the API endpoint
async function testSocialAPIPipeline() {
  try {
    // First, let's start a development server if it's not running
    console.log('Starting development server...');
    const { spawn } = require('child_process');
    
    // Start the dev server in background
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: true
    });
    
    // Wait for server to start
    await new Promise((resolve) => {
      let output = '';
      server.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Ready in') || output.includes('Local:')) {
          console.log('✅ Development server started');
          resolve();
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        console.log('⏰ Server startup timeout, continuing with test...');
        resolve();
      }, 30000);
    });
    
    // Test the social feeds API endpoint
    console.log('\n📡 Testing social feeds API endpoint...');
    
    try {
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
      
    } catch (apiError) {
      console.error('❌ Error testing social feeds API:', apiError.message);
    }
    
    // Clean up
    server.kill();
    console.log('🛑 Development server stopped');
    
  } catch (error) {
    console.error('❌ Error in pipeline test:', error.message);
  }
}

testSocialAPIPipeline().catch(console.error);
