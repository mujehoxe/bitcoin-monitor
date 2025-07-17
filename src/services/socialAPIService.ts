import { NewsArticle } from "@/types/sentiment";

export interface APIFeed {
  id: string;
  name: string;
  url: string;
  type: 'binance-square' | 'binance-news' | 'twitter' | 'reddit';
  category: string;
  headers?: Record<string, string>;
  body?: string;
  method?: 'GET' | 'POST';
}

export class SocialAPIService {
  private static instance: SocialAPIService;
  private feeds: APIFeed[] = [];
  private articles: NewsArticle[] = [];

  static getInstance(): SocialAPIService {
    if (!SocialAPIService.instance) {
      SocialAPIService.instance = new SocialAPIService();
    }
    return SocialAPIService.instance;
  }

  constructor() {
    this.initializeFeeds();
  }

  private initializeFeeds(): void {
    // Note: Binance APIs are currently being blocked by CloudFront
    // We'll focus on Reddit feeds which are already handled by RSS service
    // and prepare for Twitter/X integration when available
    this.feeds = [
      // Placeholder for future Twitter/X integration
      // {
      //   id: 'twitter-crypto',
      //   name: 'Twitter Crypto',
      //   url: 'https://api.twitter.com/2/tweets/search/recent?query=bitcoin OR ethereum OR crypto',
      //   type: 'twitter',
      //   category: 'social',
      //   method: 'GET',
      //   headers: {
      //     'Authorization': 'Bearer YOUR_TWITTER_BEARER_TOKEN'
      //   }
      // },
      
      // Binance Square - with proper headers for API access
      {
        id: 'binance-square',
        name: 'Binance Square',
        url: 'https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list',
        type: 'binance-square',
        category: 'social',
        method: 'POST',
        headers: {
          'clienttype': 'web',
          'content-type': 'application/json',
          'versioncode': 'web',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Origin': 'https://www.binance.com',
          'Referer': 'https://www.binance.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
        body: JSON.stringify({
          pageIndex: 1,
          pageSize: 20,
          scene: "web-homepage"
        })
      },
      {
        id: 'binance-news',
        name: 'Binance News',
        url: 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=20&strategy=6&tagId=0&featured=false',
        type: 'binance-news',
        category: 'news',
        method: 'GET',
        headers: {
          'clienttype': 'web',
          'content-type': 'application/json',
          'versioncode': 'web',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Origin': 'https://www.binance.com',
          'Referer': 'https://www.binance.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      }
    ];
  }

  async fetchAllFeeds(): Promise<NewsArticle[]> {
    console.log('🔄 Fetching from social API feeds...');
    
    const fetchPromises = this.feeds.map(feed => this.fetchSingleFeed(feed));
    const results = await Promise.allSettled(fetchPromises);
    
    const allArticles: NewsArticle[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      } else {
        console.warn(`⚠️ Failed to fetch ${this.feeds[index].name}: ${result.reason}`);
      }
    });

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    this.articles = allArticles;
    console.log(`✅ Fetched ${this.articles.length} articles from ${this.feeds.length} social API feeds`);
    
    return this.articles;
  }

  private async fetchSingleFeed(feed: APIFeed): Promise<NewsArticle[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for API calls

      // Prepare headers - let fetch handle Content-Length and Host automatically
      const headers = { ...feed.headers };
      
      // Add Accept-Encoding to handle compressed responses
      if (!headers['Accept-Encoding']) {
        headers['Accept-Encoding'] = 'gzip, deflate, br';
      }

      const response = await fetch(feed.url, {
        method: feed.method || 'GET',
        headers: headers,
        body: feed.body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check for CloudFront blocking
        if (response.status === 403) {
          const text = await response.text();
          if (text.includes('CloudFront') || text.includes('403 ERROR')) {
            throw new Error('Blocked by CloudFront - API access restricted');
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAPIResponse(data, feed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ Failed to fetch ${feed.name}: ${errorMessage}`);
      
      // For now, return empty array for blocked APIs
      // In the future, we can implement alternative data sources
      return [];
    }
  }

  private parseAPIResponse(data: unknown, feed: APIFeed): NewsArticle[] {
    try {
      switch (feed.type) {
        case 'binance-square':
          return this.parseBinanceSquare(data, feed);
        case 'binance-news':
          return this.parseBinanceNews(data, feed);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error parsing ${feed.name} response:`, error);
      return [];
    }
  }

  private parseBinanceSquare(data: unknown, feed: APIFeed): NewsArticle[] {
    if (!data || typeof data !== 'object' || !('data' in data)) return [];
    
    const dataObj = data as { data?: { feeds?: unknown[]; vos?: unknown[] } };
    
    // The API can return data in either 'feeds' or 'vos' arrays
    const feeds = dataObj.data?.feeds || dataObj.data?.vos || [];
    if (!feeds.length) return [];

    // Filter out non-article content like KOL_RECOMMEND_GROUP, SPACE_LIVE, etc.
    const articleFeeds = feeds.filter((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      const cardType = itemObj.cardType;
      
      // Only include actual content posts, not recommendations or live content
      return cardType === 'BUZZ_LONG' || cardType === 'BUZZ_SHORT' || 
             (cardType && !cardType.toString().includes('RECOMMEND') && 
              !cardType.toString().includes('LIVE') && 
              !cardType.toString().includes('GROUP'));
    });

    return articleFeeds.map((item: unknown, index: number) => {
      const itemObj = item as Record<string, unknown>;
      const title = String(itemObj.title || 'Binance Square Post');
      const content = String(itemObj.content || itemObj.subTitle || '');
      
      return {
        id: `binance-square-${itemObj.id || Date.now()}-${index}`,
        title: title,
        description: this.cleanText(content),
        content: this.cleanText(content),
        publishedAt: new Date(Number(itemObj.date) * 1000 || Date.now()).toISOString(),
        source: feed.name,
        url: String(itemObj.webLink || `https://www.binance.com/en/square/post/${itemObj.id}`),
        author: String(itemObj.authorName || 'Anonymous'),
        category: feed.category,
        urlToImage: itemObj.images && Array.isArray(itemObj.images) && itemObj.images.length > 0 ? String(itemObj.images[0]) : undefined
      };
    });
  }

  private parseBinanceNews(data: unknown, feed: APIFeed): NewsArticle[] {
    if (!data || typeof data !== 'object' || !('data' in data)) return [];
    
    const dataObj = data as { data?: { vos?: unknown[] } };
    if (!dataObj.data?.vos) return [];

    return dataObj.data.vos.map((item: unknown, index: number) => {
      const itemObj = item as Record<string, unknown>;
      return {
        id: `binance-news-${itemObj.id || Date.now()}-${index}`,
        title: String(itemObj.title || 'Binance News'),
        description: this.cleanText(String(itemObj.subTitle || itemObj.title || '')),
        content: this.cleanText(String(itemObj.subTitle || itemObj.title || '')),
        publishedAt: new Date(Number(itemObj.date) * 1000 || Date.now()).toISOString(),
        source: feed.name,
        url: String(itemObj.webLink || `https://www.binance.com/en/square/post/${itemObj.id}`),
        author: String(itemObj.authorName || 'Binance News'),
        category: feed.category,
        urlToImage: itemObj.images && Array.isArray(itemObj.images) && itemObj.images.length > 0 ? String(itemObj.images[0]) : undefined
      };
    });
  }

  private cleanText(text: string): string {
    if (!text) return '';
    
    // Remove HTML tags and clean up text
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

  getArticles(): NewsArticle[] {
    return this.articles;
  }

  async refreshFeeds(): Promise<void> {
    await this.fetchAllFeeds();
  }
}
