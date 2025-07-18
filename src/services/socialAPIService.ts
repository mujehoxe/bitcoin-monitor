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
  private static instance: SocialAPIService | null = null;
  private feeds: APIFeed[] = [];
  private articles: NewsArticle[] = [];

  static getInstance(): SocialAPIService {
    if (!SocialAPIService.instance) {
      SocialAPIService.instance = new SocialAPIService();
    }
    return SocialAPIService.instance;
  }

  static resetInstance(): void {
    SocialAPIService.instance = null;
  }

  constructor() {
    this.initializeFeeds();
  }

  private generateDeviceInfo(): string {
    // Generate randomized/anonymized device info for Binance API
    // This helps prevent duplicate content and improves API compatibility
    const randomValues = {
      canvas_code: Math.random().toString(36).substring(2, 10),
      fingerprint: Math.random().toString(36).substring(2, 34),
      audio: (Math.random() * 200 + 100).toFixed(14),
      screen_resolution: Math.random() > 0.5 ? "1920,1080" : "1366,768",
      available_screen_resolution: Math.random() > 0.5 ? "1920,1050" : "1366,728",
      timezoneOffset: Math.floor(Math.random() * 24) - 12, // Random timezone offset
    };

    const deviceInfo = {
      screen_resolution: randomValues.screen_resolution,
      available_screen_resolution: randomValues.available_screen_resolution,
      system_version: "Linux x86_64",
      brand_model: "unknown",
      system_lang: "en-US",
      timezone: "GMT+00:00",
      timezoneOffset: randomValues.timezoneOffset,
      user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      list_plugin: "PDF Viewer,Chrome PDF Viewer,Chromium PDF Viewer,Microsoft Edge PDF Viewer,WebKit built-in PDF",
      canvas_code: randomValues.canvas_code,
      webgl_vendor: "Google Inc. (Intel)",
      webgl_renderer: "ANGLE (Intel, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)",
      audio: randomValues.audio,
      platform: "Linux x86_64",
      web_timezone: "UTC",
      device_name: "Chrome V138.0.0.0 (Linux)",
      fingerprint: randomValues.fingerprint,
      device_id: "",
      related_device_ids: ""
    };

    // Convert to base64
    const deviceInfoStr = JSON.stringify(deviceInfo);
    return Buffer.from(deviceInfoStr).toString('base64');
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
      
      // Binance Square - Page 1
      {
        id: 'binance-square-p1',
        name: 'Binance Square',
        url: 'https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list',
        type: 'binance-square',
        category: 'social',
        method: 'POST',
        headers: {
          'clienttype': 'web',
          'content-type': 'application/json',
          'versioncode': 'web',
          // device-info will be generated per request
        },
        body: JSON.stringify({
          pageIndex: 1,
          pageSize: 50,
          scene: "web-homepage"
        })
      },
      // Binance Square - Page 2
      {
        id: 'binance-square-p2',
        name: 'Binance Square',
        url: 'https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list',
        type: 'binance-square',
        category: 'social',
        method: 'POST',
        headers: {
          'clienttype': 'web',
          'content-type': 'application/json',
          'versioncode': 'web',
          // device-info will be generated per request
        },
        body: JSON.stringify({
          pageIndex: 2,
          pageSize: 50,
          scene: "web-homepage"
        })
      },
      // Binance Square - Page 3
      {
        id: 'binance-square-p3',
        name: 'Binance Square',
        url: 'https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list',
        type: 'binance-square',
        category: 'social',
        method: 'POST',
        headers: {
          'clienttype': 'web',
          'content-type': 'application/json',
          'versioncode': 'web',
          // device-info will be generated per request
        },
        body: JSON.stringify({
          pageIndex: 3,
          pageSize: 50,
          scene: "web-homepage"
        })
      },
      {
        id: 'binance-news',
        name: 'Binance News',
        url: 'https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=50',
        type: 'binance-news',
        category: 'news',
        method: 'GET',
        headers: {
          'clienttype': 'web',
          'content-type': 'application/json',
          // device-info will be generated per request
        }
      }
    ];
  }

  async fetchAllFeeds(): Promise<NewsArticle[]> {
    console.log('🔄 Fetching from social API feeds...');
    console.log(`📊 Total feeds configured: ${this.feeds.length}`);
    
    const fetchPromises = this.feeds.map(feed => this.fetchSingleFeed(feed));
    const results = await Promise.allSettled(fetchPromises);
    
    const allArticles: NewsArticle[] = [];
    results.forEach((result, index) => {
      const feedName = this.feeds[index].name;
      if (result.status === 'fulfilled') {
        console.log(`✅ ${feedName}: ${result.value.length} articles`);
        allArticles.push(...result.value);
      } else {
        console.warn(`⚠️ Failed to fetch ${feedName}: ${result.reason}`);
      }
    });

    // Enhanced deduplication based on post ID for Binance Square posts
    const seenPostIds = new Set<string>();
    const deduplicatedArticles: NewsArticle[] = [];
    
    allArticles.forEach(article => {
      if (article.source === 'Binance Square') {
        // Extract post ID from the article ID or URL
        let postId = '';
        if (article.id.includes('binance-square-')) {
          // Extract from our generated ID: binance-square-{postId}-{index}
          const parts = article.id.split('-');
          if (parts.length >= 3) {
            postId = parts[2];
          }
        } else if (article.url && article.url.includes('/square/post/')) {
          // Extract from URL
          const urlParts = article.url.split('/square/post/');
          if (urlParts.length > 1) {
            postId = urlParts[1];
          }
        }
        
        if (postId && seenPostIds.has(postId)) {
          console.log(`🔄 Skipping duplicate Binance Square post: ${postId}`);
          return; // Skip duplicate
        }
        
        if (postId) {
          seenPostIds.add(postId);
        }
      }
      
      deduplicatedArticles.push(article);
    });

    console.log(`📊 Before deduplication: ${allArticles.length} articles`);
    console.log(`📊 After deduplication: ${deduplicatedArticles.length} articles`);
    console.log(`📊 Binance Square unique posts: ${seenPostIds.size}`);

    // Sort by publication date (newest first)
    deduplicatedArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    this.articles = deduplicatedArticles;
    console.log(`✅ Total after deduplication: ${this.articles.length} articles from ${this.feeds.length} social API feeds`);
    
    return this.articles;
  }

  private async fetchSingleFeed(feed: APIFeed): Promise<NewsArticle[]> {
    console.log(`🔄 Fetching ${feed.name} from ${feed.url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for API calls

      // Prepare headers - let fetch handle Content-Length and Host automatically
      const headers = { ...feed.headers };
      
      // Generate fresh device-info header for each request to help prevent duplicates
      if (feed.type === 'binance-square' || feed.type === 'binance-news') {
        headers['device-info'] = this.generateDeviceInfo();
      }
      
      // Remove headers that should be auto-calculated
      delete headers['Content-Length'];
      delete headers['Host'];

      console.log(`📡 ${feed.name}: Making ${feed.method || 'GET'} request`);
      
      const response = await fetch(feed.url, {
        method: feed.method || 'GET',
        headers: headers,
        body: feed.body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📊 ${feed.name}: Response status ${response.status}`);

      if (!response.ok) {
        // Check for CloudFront blocking
        if (response.status === 403) {
          const text = await response.text();
          if (text.includes('CloudFront') || text.includes('403 ERROR')) {
            throw new Error('Blocked by CloudFront - API access restricted');
          }
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const articles = this.parseAPIResponse(data, feed);
      console.log(`✅ ${feed.name}: Parsed ${articles.length} articles`);
      
      return articles;
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
    if (!data || typeof data !== 'object' || !('data' in data)) {
      console.log('❌ Binance Square: Invalid data structure');
      return [];
    }
    
    const dataObj = data as { data?: { feeds?: unknown[]; vos?: unknown[] } };
    
    // The API can return data in either 'feeds' or 'vos' arrays
    const feeds = dataObj.data?.feeds || dataObj.data?.vos || [];
    console.log(`📊 Binance Square: Raw items received: ${feeds.length}`);
    
    if (!feeds.length) {
      console.log('❌ Binance Square: No feeds in response');
      return [];
    }

    // Show card types for debugging
    const cardTypes: { [key: string]: number } = {};
    feeds.forEach((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      const cardType = itemObj.cardType || 'unknown';
      cardTypes[cardType.toString()] = (cardTypes[cardType.toString()] || 0) + 1;
    });
    
    console.log('📊 Binance Square card types:', cardTypes);

    // Filter out non-article content - be more permissive to get more articles
    const articleFeeds = feeds.filter((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      const cardType = itemObj.cardType;
      
      // Include almost everything except obvious spam/promotional content
      if (!cardType) return false;
      
      const cardTypeStr = cardType.toString();
      
      // Only exclude very specific non-content types
      const excludeTypes = [
        'KOL_RECOMMEND_GROUP',
        'SPACE_LIVE'
      ];
      
      // Include everything else
      return !excludeTypes.some(exclude => cardTypeStr.includes(exclude));
    });

    console.log(`📊 Binance Square: ${articleFeeds.length} articles after filtering`);

    return articleFeeds.map((item: unknown, index: number) => {
      const itemObj = item as Record<string, unknown>;
      const author = String(itemObj.authorName || 'Anonymous');
      const content = String(itemObj.content || itemObj.subTitle || '');
      const postId = String(itemObj.id || Date.now());
      
      // Use author as title instead of "Binance Square Post"
      const title = author;
      
      // Extract engagement metrics
      const engagementMetrics = {
        viewCount: Number(itemObj.viewCount) || 0,
        likeCount: Number(itemObj.likeCount) || 0,
        commentCount: Number(itemObj.commentCount) || 0,
        shareCount: Number(itemObj.shareCount) || 0,
        quoteCount: Number(itemObj.quoteCount) || 0,
      };
      
      return {
        id: `binance-square-${postId}-${index}`,
        title: title,
        description: this.cleanText(content),
        content: this.cleanText(content),
        publishedAt: new Date(Number(itemObj.date) * 1000 || Date.now()).toISOString(),
        source: feed.name,
        url: String(itemObj.webLink || `https://www.binance.com/en/square/post/${postId}`),
        author: author,
        category: feed.category,
        urlToImage: itemObj.images && Array.isArray(itemObj.images) && itemObj.images.length > 0 ? String(itemObj.images[0]) : undefined,
        engagementMetrics: engagementMetrics
      };
    });
  }

  private parseBinanceNews(data: unknown, feed: APIFeed): NewsArticle[] {
    if (!data || typeof data !== 'object' || !('data' in data)) return [];
    
    const dataObj = data as { data?: { vos?: unknown[] } };
    if (!dataObj.data?.vos) return [];

    return dataObj.data.vos.map((item: unknown, index: number) => {
      const itemObj = item as Record<string, unknown>;
      
      // Extract engagement metrics for News posts too
      const engagementMetrics = {
        viewCount: Number(itemObj.viewCount) || 0,
        likeCount: Number(itemObj.likeCount) || 0,
        commentCount: Number(itemObj.commentCount) || 0,
        shareCount: Number(itemObj.shareCount) || 0,
        quoteCount: Number(itemObj.quoteCount) || 0,
      };
      
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
        urlToImage: itemObj.images && Array.isArray(itemObj.images) && itemObj.images.length > 0 ? String(itemObj.images[0]) : undefined,
        engagementMetrics: engagementMetrics
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
