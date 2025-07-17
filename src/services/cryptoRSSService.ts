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
    
    const fetchPromises = this.feeds
      .filter(feed => feed.isActive && feed.errorCount < this.maxErrorCount)
      .map(feed => this.fetchSingleFeed(feed));

    const results = await Promise.allSettled(fetchPromises);
    
    const allArticles: NewsArticle[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      } else {
        const feed = this.feeds[index];
        feed.errorCount++;
        if (feed.errorCount >= this.maxErrorCount) {
          feed.isActive = false;
          console.warn(`❌ Deactivated feed ${feed.name} after ${this.maxErrorCount} errors`);
        }
      }
    });

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

    console.log(`✅ Fetched ${this.articles.length} articles from ${this.getActiveFeeds().length} feeds`);
    return this.articles;
  }

  private async fetchSingleFeed(feed: CryptoFeed): Promise<NewsArticle[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const articles = this.parseRSSFeed(xmlText, feed);
      
      feed.lastFetched = new Date();
      feed.errorCount = Math.max(0, feed.errorCount - 1); // Reduce error count on success
      
      return articles;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${feed.name}: ${error}`);
      feed.errorCount++;
      return [];
    }
  }

  private parseRSSFeed(xmlText: string, feed: CryptoFeed): NewsArticle[] {
    try {
      // Simple regex-based XML parsing (more reliable than DOMParser in Node.js)
      const items = this.extractItemsFromXML(xmlText);
      
      return items.map((item, index) => {
        const title = this.extractXMLContent(item, 'title') || 'No title';
        const description = this.extractXMLContent(item, 'description') || 
                           this.extractXMLContent(item, 'content:encoded') || 
                           'No description';
        const link = this.extractXMLContent(item, 'link') || '';
        const pubDate = this.extractXMLContent(item, 'pubDate') || new Date().toISOString();
        const author = this.extractXMLContent(item, 'author') || 
                      this.extractXMLContent(item, 'dc:creator') || 
                      feed.name;

        return {
          id: `${feed.name}-${Date.now()}-${index}`,
          title: this.cleanText(title),
          description: this.cleanText(description),
          content: this.cleanText(description),
          publishedAt: this.parseDate(pubDate),
          source: feed.name,
          url: link,
          author: this.cleanText(author),
          urlToImage: this.extractImageFromDescription(description)
        };
      });
    } catch (error) {
      console.error(`Error parsing RSS for ${feed.name}:`, error);
      return [];
    }
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
