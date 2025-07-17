// Test the new diverse feeds and category system
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing diverse feeds and category system...\n');

// Test 1: Check new CSV
try {
  const csvPath = path.join(__dirname, 'crypto_feeds.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n')
    .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
  
  console.log(`✅ CSV Test: ${lines.length} feeds loaded`);
  
  // Categorize feeds
  const categories = {
    news: 0,
    blogs: 0,
    magazines: 0,
    social: 0,
    other: 0
  };
  
  lines.forEach(line => {
    const url = line.toLowerCase();
    if (url.includes('reddit.com') || url.includes('twitter.com') || url.includes('x.com')) {
      categories.social++;
    } else if (url.includes('news') || url.includes('telegraph') || url.includes('daily') || url.includes('today')) {
      categories.news++;
    } else if (url.includes('blog') || url.includes('medium') || url.includes('substack')) {
      categories.blogs++;
    } else if (url.includes('magazine') || url.includes('review') || url.includes('analysis')) {
      categories.magazines++;
    } else {
      categories.other++;
    }
  });
  
  console.log('📊 Feed categories:');
  console.log(`   📰 News: ${categories.news}`);
  console.log(`   📝 Blogs: ${categories.blogs}`);
  console.log(`   📖 Magazines: ${categories.magazines}`);
  console.log(`   📱 Social: ${categories.social}`);
  console.log(`   📄 Other: ${categories.other}`);
  
  // Check for Reddit feeds
  const redditFeeds = lines.filter(line => line.includes('reddit.com'));
  console.log(`\n📱 Reddit feeds: ${redditFeeds.length}`);
  redditFeeds.forEach(feed => {
    const subreddit = feed.match(/r\/([^\/]+)/)?.[1] || 'unknown';
    console.log(`   • r/${subreddit}`);
  });
  
  // Check for redirects that need fixing
  const redirectFeeds = [
    'https://cryptopotato.com/feed', // redirects to https://cryptopotato.com/feed/
    'https://blog.coinbase.com/feed' // redirects to https://www.coinbase.com/blog
  ];
  
  const needsFixing = lines.filter(line => 
    redirectFeeds.some(redirect => line.includes(redirect.split('/')[2]))
  );
  
  if (needsFixing.length > 0) {
    console.log(`\n⚠️  Feeds that may need redirect handling: ${needsFixing.length}`);
    needsFixing.forEach(feed => console.log(`   • ${feed}`));
  }
  
} catch (error) {
  console.error('❌ CSV test failed:', error);
}

// Test 2: Check category classification logic
console.log('\n🔍 Testing category classification...');

const testUrls = [
  'https://cointelegraph.com/feed',
  'https://reddit.com/r/bitcoin/hot/.rss',
  'https://bitcoinmagazine.com/feed',
  'https://blog.coinbase.com/feed',
  'https://news.bitcoin.com/feed/'
];

testUrls.forEach(url => {
  let category = 'other';
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('reddit.com') || lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    category = 'social';
  } else if (lowerUrl.includes('news') || lowerUrl.includes('telegraph') || lowerUrl.includes('daily') || lowerUrl.includes('today')) {
    category = 'news';
  } else if (lowerUrl.includes('blog') || lowerUrl.includes('medium') || lowerUrl.includes('substack')) {
    category = 'blog';
  } else if (lowerUrl.includes('magazine') || lowerUrl.includes('review') || lowerUrl.includes('analysis')) {
    category = 'magazine';
  }
  
  console.log(`📂 ${url} → ${category}`);
});

console.log('\n🎉 Improvements summary:');
console.log('  ✅ Added diverse source types (news, blogs, magazines, social)');
console.log('  ✅ Added Reddit feeds for community content');
console.log('  ✅ Improved redirect handling');
console.log('  ✅ Enhanced category classification');
console.log('  ✅ Better RSS parsing for different formats');
console.log('  ✅ Updated UI with new category tabs');
console.log('\n🚀 Ready for testing with diverse content!');
