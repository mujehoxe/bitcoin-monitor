// Using built-in fetch (Node.js 18+)

// Test specific feeds with parsing issues
const testFeeds = [
  'https://cointelegraph.com/feed',
  'https://www.newsbtc.com/feed/',
  'https://btcmanager.com/feed/',
  'https://cryptodaily.co.uk/feed/'
];

function extractXMLContent(xmlText, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xmlText.match(regex);
  return match ? match[1].trim() : null;
}

function extractItemsFromXML(xmlText) {
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const items = [];
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    items.push(match[1]);
  }
  
  return items;
}

async function testFeed(feedUrl) {
  console.log(`\n🔍 Testing feed: ${feedUrl}`);
  
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.google.com/'
      }
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const xmlText = await response.text();
    console.log(`📄 Response length: ${xmlText.length} characters`);
    
    // Check if it's valid XML
    if (!xmlText.includes('<rss') && !xmlText.includes('<feed') && !xmlText.includes('<?xml')) {
      console.error('❌ Not a valid RSS/XML feed');
      return;
    }

    const items = extractItemsFromXML(xmlText);
    console.log(`📰 Found ${items.length} items`);
    
    if (items.length > 0) {
      const firstItem = items[0];
      console.log('\n📝 First item analysis:');
      
      // Check different title formats
      const title1 = extractXMLContent(firstItem, 'title');
      const title2 = extractXMLContent(firstItem, 'title');
      const titleCDATA = firstItem.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i);
      
      console.log(`Title (regular): ${title1 ? title1.substring(0, 100) : 'NULL'}`);
      console.log(`Title (CDATA): ${titleCDATA ? titleCDATA[1].substring(0, 100) : 'NULL'}`);
      
      // Check different description formats
      const desc1 = extractXMLContent(firstItem, 'description');
      const desc2 = extractXMLContent(firstItem, 'content:encoded');
      const desc3 = extractXMLContent(firstItem, 'content');
      const descCDATA = firstItem.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i);
      
      console.log(`Description (regular): ${desc1 ? desc1.substring(0, 100) : 'NULL'}`);
      console.log(`Description (CDATA): ${descCDATA ? descCDATA[1].substring(0, 100) : 'NULL'}`);
      console.log(`Content:encoded: ${desc2 ? desc2.substring(0, 100) : 'NULL'}`);
      console.log(`Content: ${desc3 ? desc3.substring(0, 100) : 'NULL'}`);
      
      // Show raw item (first 500 chars)
      console.log('\n📄 Raw item (first 500 chars):');
      console.log(firstItem.substring(0, 500));
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Testing RSS feeds with parsing issues...\n');
  
  for (const feedUrl of testFeeds) {
    await testFeed(feedUrl);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
}

main().catch(console.error);
