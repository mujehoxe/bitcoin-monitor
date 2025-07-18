// Test RSS feed loading and parsing
import { promises as fs } from 'fs';
import { CryptoRSSService } from './src/services/cryptoRSSService.js';

async function testRSSFeedsLoading() {
  console.log('🔍 Testing RSS feeds loading and parsing...\n');
  
  try {
    // Read the CSV file
    const csvContent = await fs.readFile('./crypto_feeds.csv', 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('Feeds'));
    
    console.log(`📊 Found ${lines.length} feeds in CSV file`);
    
    // Check for specific feeds
    const checkFeeds = [
      'https://feeds.bloomberg.com/crypto/news.rss',
      'https://news.google.com/rss',
      'https://cointelegraph.com/feed',
      'https://www.newsbtc.com/feed/',
      'https://btcmanager.com/feed/',
      'https://cryptodaily.co.uk/feed/'
    ];
    
    console.log('\n🔍 Checking for specific feeds:');
    checkFeeds.forEach(feed => {
      const found = lines.some(line => line.trim() === feed);
      console.log(`${found ? '✅' : '❌'} ${feed}`);
    });
    
    // Initialize RSS service
    const rssService = new CryptoRSSService(lines);
    
    // Test with a few feeds
    console.log('\n🚀 Testing RSS parsing with a few feeds...');
    const testFeeds = [
      'https://cointelegraph.com/feed',
      'https://www.newsbtc.com/feed/',
      'https://btcmanager.com/feed/'
    ];
    
    const testService = new CryptoRSSService(testFeeds);
    const articles = await testService.fetchAllFeeds();
    
    console.log(`\n📰 Fetched ${articles.length} articles from test feeds`);
    
    // Show sample articles
    articles.slice(0, 3).forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Description: ${article.description.substring(0, 100)}${article.description.length > 100 ? '...' : ''}`);
      console.log(`   URL: ${article.url}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRSSFeedsLoading();
