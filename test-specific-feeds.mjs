// Test specific feed parsing directly
import { CryptoRSSService } from './src/services/cryptoRSSService.js';

async function testSpecificFeeds() {
  console.log('🔍 Testing specific feed parsing...\n');
  
  // Test the problematic feeds
  const problematicFeeds = [
    'https://cointelegraph.com/feed',
    'https://www.newsbtc.com/feed/',
    'https://btcmanager.com/feed/',
    'https://cryptodaily.co.uk/feed/'
  ];
  
  const service = new CryptoRSSService(problematicFeeds);
  
  try {
    const articles = await service.fetchAllFeeds();
    console.log(`📰 Total articles fetched: ${articles.length}\n`);
    
    // Group by source
    const bySource = {};
    articles.forEach(article => {
      if (!bySource[article.source]) {
        bySource[article.source] = [];
      }
      bySource[article.source].push(article);
    });
    
    // Show results for each source
    Object.entries(bySource).forEach(([source, sourceArticles]) => {
      console.log(`\n📊 ${source}: ${sourceArticles.length} articles`);
      
      // Show first article details
      if (sourceArticles.length > 0) {
        const first = sourceArticles[0];
        console.log(`  Title: ${first.title}`);
        console.log(`  Description: ${first.description.substring(0, 100)}${first.description.length > 100 ? '...' : ''}`);
        console.log(`  Has title: ${first.title !== 'No title' ? '✅' : '❌'}`);
        console.log(`  Has description: ${first.description !== 'No description available' ? '✅' : '❌'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSpecificFeeds();
