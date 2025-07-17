const fs = require('fs');
const path = require('path');

// Test CSV loading
try {
  const csvPath = path.join(__dirname, 'crypto_feeds.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n')
    .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
  
  console.log('🔍 Testing crypto_feeds.csv loading...');
  console.log(`📊 Found ${lines.length} feeds in CSV`);
  
  lines.slice(0, 5).forEach((line, index) => {
    console.log(`${index + 1}. ${line.trim()}`);
  });

  // Test RSS parsing logic
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Test Bitcoin Article</title>
      <link>https://example.com/test</link>
      <description>This is a test article about Bitcoin</description>
      <pubDate>Wed, 17 Jul 2024 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  // Simple regex parsing test
  const itemRegex = /<item>(.*?)<\/item>/gs;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link><!\[CDATA\[(.*?)\]\]><\/link>|<link>(.*?)<\/link>/;
  const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;

  let match;
  let items = [];
  
  while ((match = itemRegex.exec(testXml)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = titleRegex.exec(itemContent);
    const linkMatch = linkRegex.exec(itemContent);
    const descMatch = descRegex.exec(itemContent);
    const pubDateMatch = pubDateRegex.exec(itemContent);
    
    items.push({
      title: titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '',
      link: linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '',
      description: descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '',
      pubDate: pubDateMatch ? pubDateMatch[1].trim() : ''
    });
  }
  
  console.log('\n🧪 Testing RSS parsing logic...');
  console.log('Parsed items:', items);
  
} catch (error) {
  console.error('❌ Error during test:', error);
}
