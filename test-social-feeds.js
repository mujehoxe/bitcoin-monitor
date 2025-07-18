async function testSocialFeeds() {
  console.log('🔍 Testing /api/social-feeds endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/social-feeds');
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Total articles received:', data.articles?.length || 0);
    
    if (data.articles && data.articles.length > 0) {
      console.log('\n📝 First 3 articles:');
      data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`${index + 1}. ${article.title} (${article.source})`);
      });
    }
    
    // Check for Binance News specifically
    const binanceNews = data.articles?.filter(article => 
      article.source.toLowerCase().includes('binance') && 
      article.source.toLowerCase().includes('news')
    ) || [];
    
    const binanceSquare = data.articles?.filter(article => 
      article.source.toLowerCase().includes('binance') && 
      article.source.toLowerCase().includes('square')
    ) || [];
    
    console.log(`\n📊 Binance News articles: ${binanceNews.length}`);
    console.log(`📊 Binance Square articles: ${binanceSquare.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSocialFeeds();
