#!/usr/bin/env node

// Test categorization with sample data
const testSources = [
  // Should be categorized as 'blog'
  { url: 'https://cryptobriefing.com/feed/', title: 'Market Analysis Today', description: 'Analysis of crypto trends' },
  { url: 'https://cryptodaily.co.uk/feed/', title: 'Daily crypto news', description: 'Today in crypto' },
  { url: 'https://dailyhodl.com/feed/', title: 'HODL strategy', description: 'Investment advice' },
  
  // Should be categorized as 'magazine'
  { url: 'https://decrypt.co/feed/', title: 'Blockchain tech review', description: 'Technical analysis' },
  { url: 'https://blockworks.co/feed/', title: 'Industry report', description: 'Market analysis' },
  { url: 'https://cryptoslate.com/feed/', title: 'Crypto news update', description: 'Latest developments' },
  
  // Should be categorized as 'social'
  { url: 'https://reddit.com/r/bitcoin/hot/.rss', title: 'Bitcoin discussion', description: 'Community post' },
  { url: 'https://reddit.com/r/cryptocurrency/hot/.rss', title: 'Crypto talk', description: 'User discussion' },
  
  // Should be categorized as 'analysis'
  { url: 'https://theblock.co/feed/', title: 'Market prediction', description: 'Price analysis and forecast' },
  { url: 'https://finbold.com/feed/', title: 'Investment review', description: 'Financial analysis' },
  
  // Should be categorized as 'news'
  { url: 'https://coindesk.com/feed/', title: 'Breaking news', description: 'Latest crypto news' },
  { url: 'https://cointelegraph.com/feed/', title: 'Crypto updates', description: 'Industry news' },
  { url: 'https://newsbtc.com/feed/', title: 'Bitcoin news', description: 'Market updates' },
];

// Simple categorization function (copy from the RSS service)
function determineCategory(feedUrl, title, description) {
  const url = feedUrl.toLowerCase();
  const content = (title + ' ' + description).toLowerCase();
  
  // Social media sources (Reddit feeds)
  if (url.includes('reddit.com') || url.includes('twitter.com') || url.includes('x.com')) {
    return 'social';
  }
  
  // Blogs - expanded detection
  if (url.includes('blog') || url.includes('medium') || url.includes('substack') ||
      url.includes('cryptobriefing') || url.includes('cryptodaily') || 
      url.includes('dailyhodl') || url.includes('cryptomode') ||
      url.includes('cryptovibes') || url.includes('nulltx') ||
      url.includes('cryptoweekly') || url.includes('cryptovest') ||
      url.includes('cryptobasic') || url.includes('cryptogazette')) {
    return 'blog';
  }
  
  // Magazines - expanded detection
  if (url.includes('magazine') || url.includes('review') || 
      url.includes('decrypt') || url.includes('blockworks') ||
      url.includes('coinpedia') || url.includes('cryptoslate') ||
      url.includes('beincrypto') || url.includes('coincu') ||
      url.includes('blockonomi') || url.includes('cryptoticker') ||
      url.includes('cryptopolitan') || url.includes('coinspeaker')) {
    return 'magazine';
  }
  
  // Analysis sources
  if (url.includes('analysis') || url.includes('theblock') ||
      url.includes('thecurrencyanalytics') || url.includes('finbold') ||
      url.includes('ambcrypto') || url.includes('coingape') ||
      content.includes('analysis') || content.includes('review') || 
      content.includes('opinion') || content.includes('prediction')) {
    return 'analysis';
  }
  
  // News sources - traditional news outlets
  if (url.includes('news') || url.includes('telegraph') || url.includes('daily') || 
      url.includes('today') || url.includes('breaking') || url.includes('coindesk') ||
      url.includes('cointelegraph') || url.includes('newsbtc') ||
      url.includes('coinjournal') || url.includes('bitcoin.com') ||
      url.includes('cryptonews') || url.includes('bitcoinist') ||
      url.includes('cryptonewsz') || url.includes('btcmanager') ||
      url.includes('cryptopanic')) {
    return 'news';
  }
  
  // Default to news for unmatched sources
  return 'news';
}

console.log('🧪 Testing categorization function...');
console.log('');

const results = {
  blog: 0,
  magazine: 0,
  social: 0,
  analysis: 0,
  news: 0
};

testSources.forEach(source => {
  const category = determineCategory(source.url, source.title, source.description);
  results[category]++;
  console.log(`${source.url} -> ${category.toUpperCase()}`);
});

console.log('');
console.log('📊 Results:');
console.log(`Blogs: ${results.blog}`);
console.log(`Magazines: ${results.magazine}`);
console.log(`Social: ${results.social}`);
console.log(`Analysis: ${results.analysis}`);
console.log(`News: ${results.news}`);
