import { NewsArticle } from "@/types/sentiment";

export interface CryptoFeed {
  url: string;
  name: string;
  isActive: boolean;
  lastFetched?: Date;
  errorCount: number;
}

export class CryptoRSSService {
  private static instance: CryptoRSSService;
  private feeds: CryptoFeed[] = [];
  private articles: NewsArticle[] = [];
  private lastUpdate: Date = new Date();
  private readonly maxArticles = 200;
  private readonly maxErrorCount = 5;

  static getInstance(): CryptoRSSService {
    if (!CryptoRSSService.instance) {
      CryptoRSSService.instance = new CryptoRSSService();
    }
    return CryptoRSSService.instance;
  }

  constructor(feedUrls?: string[]) {
    if (feedUrls) {
      this.loadFeedsFromUrls(feedUrls);
    } else {
      this.feeds = this.getFallbackFeeds();
    }
  }

  private loadFeedsFromUrls(urls: string[]): void {
    try {
      this.feeds = urls.map((url: string) => ({
        url: url.trim(),
        name: this.extractFeedName(url.trim()),
        isActive: true,
        errorCount: 0
      }));

      console.log(`📰 Loaded ${this.feeds.length} crypto RSS feeds`);
    } catch (error) {
      console.error('Error loading crypto feeds from URLs:', error);
      this.feeds = this.getFallbackFeeds();
    }
  }

  // Method to initialize feeds from external source
  initializeFeeds(urls: string[]): void {
    this.loadFeedsFromUrls(urls);
  }

  private extractFeedName(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '').replace('.com', '').replace('.net', '').replace('.org', '');
    } catch {
      return 'Unknown Feed';
    }
  }

  private getFallbackFeeds(): CryptoFeed[] {
    return [
      { url: 'https://cointelegraph.com/feed', name: 'CoinTelegraph', isActive: true, errorCount: 0 },
      { url: 'https://bitcoinmagazine.com/feed', name: 'Bitcoin Magazine', isActive: true, errorCount: 0 },
      { url: 'https://decrypt.co/feed', name: 'Decrypt', isActive: true, errorCount: 0 },
      { url: 'https://coinjournal.net/feed/', name: 'CoinJournal', isActive: true, errorCount: 0 },
      { url: 'https://cryptopotato.com/feed', name: 'CryptoPotato', isActive: true, errorCount: 0 }
    ];
  }

  async fetchAllFeeds(): Promise<NewsArticle[]> {
    console.log('🔄 Fetching from all crypto RSS feeds...');
    
    const activeFeeds = this.feeds.filter(feed => feed.isActive && feed.errorCount < this.maxErrorCount);
    console.log(`📊 Attempting to fetch from ${activeFeeds.length} active feeds`);
    
    // Limit concurrent requests to prevent memory issues
    const batchSize = 10;
    const allArticles: NewsArticle[] = [];
    
    for (let i = 0; i < activeFeeds.length; i += batchSize) {
      const batch = activeFeeds.slice(i, i + batchSize);
      const batchPromises = batch.map(feed => this.fetchSingleFeed(feed));
      
      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result, index) => {
        const feedIndex = this.feeds.findIndex(f => f.url === batch[index].url);
        if (feedIndex !== -1) {
          if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
            // Reset error count on success
            this.feeds[feedIndex].errorCount = Math.max(0, this.feeds[feedIndex].errorCount - 1);
          } else {
            this.feeds[feedIndex].errorCount++;
            if (this.feeds[feedIndex].errorCount >= this.maxErrorCount) {
              this.feeds[feedIndex].isActive = false;
              console.warn(`❌ Deactivated feed ${this.feeds[feedIndex].name} after ${this.maxErrorCount} errors`);
            }
          }
        }
      });
      
      // Small delay between batches to be respectful
      if (i + batchSize < activeFeeds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Remove duplicates based on title and URL
    const uniqueArticles = this.removeDuplicates(allArticles);
    
    // Sort by publication date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Keep only recent articles (last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const recentArticles = uniqueArticles.filter(article => 
      new Date(article.publishedAt) >= cutoffDate
    );

    this.articles = recentArticles.slice(0, this.maxArticles);
    this.lastUpdate = new Date();

    const activeCount = this.getActiveFeeds().length;
    const inactiveCount = this.getInactiveFeeds().length;
    console.log(`✅ Fetched ${this.articles.length} articles from ${activeCount} active feeds (${inactiveCount} inactive)`);
    
    return this.articles;
  }

  private async fetchSingleFeed(feed: CryptoFeed): Promise<NewsArticle[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/'
        },
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      // Handle redirects manually for some feeds
      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get('location');
        if (location) {
          console.log(`🔄 Following redirect for ${feed.name}: ${location}`);
          const newController = new AbortController();
          const newTimeoutId = setTimeout(() => newController.abort(), 10000);
          
          response = await fetch(location, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache'
            },
            signal: newController.signal
          });
          
          clearTimeout(newTimeoutId);
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      if (!xmlText || xmlText.length < 50) {
        throw new Error('Empty or invalid RSS response');
      }

      // Check if it's actually an RSS/XML feed
      if (!xmlText.includes('<rss') && !xmlText.includes('<feed') && !xmlText.includes('<?xml')) {
        throw new Error('Response is not a valid RSS/XML feed');
      }

      const articles = this.parseRSSFeed(xmlText, feed);
      
      feed.lastFetched = new Date();
      
      return articles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only log errors for feeds that haven't been marked as problematic
      if (feed.errorCount < 3) {
        console.warn(`⚠️ Failed to fetch ${feed.name}: ${errorMessage}`);
      }
      
      return [];
    }
  }

  private parseRSSFeed(xmlText: string, feed: CryptoFeed): NewsArticle[] {
    try {
      // Handle different RSS formats
      const items = this.extractItemsFromXML(xmlText);
      
      return items.map((item, index) => {
        const title = this.extractXMLContent(item, 'title') || 'No title';
        const description = this.extractXMLContent(item, 'description') || 
                           this.extractXMLContent(item, 'content:encoded') || 
                           this.extractXMLContent(item, 'content') ||
                           'No description';
        const link = this.extractXMLContent(item, 'link') || 
                    this.extractXMLContent(item, 'guid') || '';
        
        // Handle different date formats
        const pubDate = this.extractXMLContent(item, 'pubDate') || 
                       this.extractXMLContent(item, 'published') ||
                       this.extractXMLContent(item, 'updated') ||
                       new Date().toISOString();
        
        const author = this.extractXMLContent(item, 'author') || 
                      this.extractXMLContent(item, 'dc:creator') || 
                      this.extractXMLContent(item, 'creator') ||
                      feed.name;

        // Determine source category
        const category = this.determineCategory(feed.url, title, description);

        return {
          id: `${feed.name}-${Date.now()}-${index}`,
          title: this.cleanText(title),
          description: this.cleanText(description),
          content: this.cleanText(description),
          publishedAt: this.parseDate(pubDate),
          source: feed.name,
          url: link,
          author: this.cleanText(author),
          urlToImage: this.extractImageFromDescription(description),
          category: category
        };
      });
    } catch (error) {
      console.error(`Error parsing RSS for ${feed.name}:`, error);
      return [];
    }
  }

  private determineCategory(feedUrl: string, title: string, description: string): string {
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
    
    // Market/Trading content
    if (content.includes('market') || content.includes('price') || 
        content.includes('trading') || content.includes('chart') ||
        content.includes('technical') || content.includes('signals')) {
      return 'market';
    }
    
    // Technology content
    if (content.includes('technology') || content.includes('development') || 
        content.includes('protocol') || content.includes('blockchain') ||
        content.includes('smart contract') || content.includes('upgrade')) {
      return 'tech';
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

  private extractItemsFromXML(xmlText: string): string[] {
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const items: string[] = [];
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      items.push(match[1]);
    }
    
    return items;
  }

  private extractXMLContent(xmlText: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xmlText.match(regex);
    return match ? match[1].trim() : null;
  }

  private cleanText(text: string): string {
    if (!text) return '';
    
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    const htmlEntities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' '
    };
    
    for (const [entity, char] of Object.entries(htmlEntities)) {
      cleaned = cleaned.replace(new RegExp(entity, 'g'), char);
    }
    
    return cleaned.trim();
  }

  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private extractImageFromDescription(description: string): string | undefined {
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = description.match(imgRegex);
    return match ? match[1] : undefined;
  }

  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = `${article.title}-${article.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getArticles(): NewsArticle[] {
    return this.articles;
  }

  getActiveFeeds(): CryptoFeed[] {
    return this.feeds.filter(feed => feed.isActive);
  }

  getInactiveFeeds(): CryptoFeed[] {
    return this.feeds.filter(feed => !feed.isActive);
  }

  getFeedStats(): {
    total: number;
    active: number;
    inactive: number;
    lastUpdate: Date;
    articleCount: number;
  } {
    return {
      total: this.feeds.length,
      active: this.getActiveFeeds().length,
      inactive: this.getInactiveFeeds().length,
      lastUpdate: this.lastUpdate,
      articleCount: this.articles.length
    };
  }

  async searchArticles(query: string): Promise<NewsArticle[]> {
    const lowerQuery = query.toLowerCase();
    return this.articles.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      article.description.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery)
    );
  }

  // Manually refresh feeds
  async refreshFeeds(): Promise<void> {
    await this.fetchAllFeeds();
  }

  // Reset error counts for all feeds
  resetErrorCounts(): void {
    this.feeds.forEach(feed => {
      feed.errorCount = 0;
      feed.isActive = true;
    });
    console.log('✅ Reset error counts for all feeds');
  }
}
