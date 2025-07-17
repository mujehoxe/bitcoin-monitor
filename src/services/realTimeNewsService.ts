import { NewsArticle } from "@/types/sentiment";
import { CryptoRSSService } from "./cryptoRSSService";
import { SocialAPIService } from "./socialAPIService";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: "crypto" | "political" | "environmental" | "general";
  hasWebSocket: boolean;
  apiKey?: string;
}

export interface RealTimeNewsConfig {
  refreshInterval: number;
  maxArticles: number;
  sources: NewsSource[];
  categories: string[];
}

export class RealTimeNewsService {
  private static instance: RealTimeNewsService;
  private config: RealTimeNewsConfig;
  private newsCache: Map<string, NewsArticle[]> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private cryptoRSSService: CryptoRSSService;
  private socialAPIService: SocialAPIService;
  private lastFetchTimes: Map<string, number> = new Map();

  private constructor() {
    this.cryptoRSSService = CryptoRSSService.getInstance();
    this.socialAPIService = SocialAPIService.getInstance();

    // Simplified configuration - only crypto RSS feeds
    this.config = {
      refreshInterval: parseInt(
        process.env.NEXT_PUBLIC_NEWS_REFRESH_INTERVAL || "300000" // 5 minutes
      ),
      maxArticles: 200,
      sources: [
        {
          id: "crypto-rss",
          name: "Crypto RSS Feeds",
          url: "/api/crypto-rss",
          category: "crypto",
          hasWebSocket: false,
        },
        {
          id: "social-api",
          name: "Social Media APIs",
          url: "/api/social-feeds",
          category: "crypto",
          hasWebSocket: false,
        },
      ],
      categories: ["crypto"],
    };
  }

  static getInstance(): RealTimeNewsService {
    if (!RealTimeNewsService.instance) {
      RealTimeNewsService.instance = new RealTimeNewsService();
    }
    return RealTimeNewsService.instance;
  }

  async initialize(): Promise<void> {
    console.log("🚀 Initializing Real-Time Crypto News Service...");
    
    // The RSS service will be initialized by the API route when first called
    // This just sets up the refresh timer
    this.startRefreshTimer();
    
    console.log("✅ Real-Time Crypto News Service initialized");
  }

  private startRefreshTimer(): void {
    const timer = setInterval(async () => {
      try {
        console.log("🔄 Auto-refreshing crypto RSS and social feeds...");
        
        // Refresh both RSS and social feeds
        const [rssResponse, socialResponse] = await Promise.allSettled([
          fetch('/api/crypto-rss?refresh=true'),
          fetch('/api/social-feeds?refresh=true')
        ]);

        let totalArticles = 0;
        
        if (rssResponse.status === 'fulfilled' && rssResponse.value.ok) {
          const rssData = await rssResponse.value.json();
          totalArticles += rssData.totalArticles || 0;
        }
        
        if (socialResponse.status === 'fulfilled' && socialResponse.value.ok) {
          const socialData = await socialResponse.value.json();
          totalArticles += socialData.totalArticles || 0;
        }

        console.log(`✅ Refreshed ${totalArticles} articles from all news sources`);
      } catch (error) {
        console.error("❌ Error during auto-refresh:", error);
      }
    }, this.config.refreshInterval);

    this.refreshTimers.set("all-feeds", timer);
  }

  async getAllNews(): Promise<NewsArticle[]> {
    try {
      // Fetch from both RSS and social media APIs
      const [rssResponse, socialResponse] = await Promise.allSettled([
        fetch('/api/crypto-rss'),
        fetch('/api/social-feeds')
      ]);

      const allArticles: NewsArticle[] = [];

      // Process RSS feeds
      if (rssResponse.status === 'fulfilled' && rssResponse.value.ok) {
        const rssData = await rssResponse.value.json();
        allArticles.push(...(rssData.articles || []));
      } else {
        console.warn('RSS feeds failed:', rssResponse.status === 'rejected' ? rssResponse.reason : 'HTTP error');
      }

      // Process social media feeds
      if (socialResponse.status === 'fulfilled' && socialResponse.value.ok) {
        const socialData = await socialResponse.value.json();
        allArticles.push(...(socialData.articles || []));
      } else {
        console.warn('Social feeds failed:', socialResponse.status === 'rejected' ? socialResponse.reason : 'HTTP error');
      }

      // Sort by publication date (newest first)
      allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      return allArticles;
    } catch (error) {
      console.error('Error fetching news from APIs:', error);
      return [];
    }
  }

  async getNewsByCategory(category: string): Promise<NewsArticle[]> {
    // All our news is crypto-related, so category filtering is not implemented yet
    // Future enhancement: implement category-based filtering
    console.log(`Fetching news for category: ${category}`);
    return this.getAllNews();
  }

  async refreshAllSources(): Promise<void> {
    console.log("🔄 Refreshing all crypto RSS and social feeds...");
    
    // Refresh RSS feeds
    await this.cryptoRSSService.refreshFeeds();
    const rssArticles = this.cryptoRSSService.getArticles();
    this.newsCache.set("crypto-rss", rssArticles);
    
    // Refresh social feeds
    await this.socialAPIService.refreshFeeds();
    const socialArticles = this.socialAPIService.getArticles();
    this.newsCache.set("social-api", socialArticles);
    
    console.log(`✅ Refreshed ${rssArticles.length} RSS articles and ${socialArticles.length} social articles`);
  }

  async searchNews(query: string): Promise<NewsArticle[]> {
    return this.cryptoRSSService.searchArticles(query);
  }

  destroy(): void {
    for (const timer of this.refreshTimers.values()) {
      clearInterval(timer);
    }
    this.refreshTimers.clear();
    this.newsCache.clear();
    console.log("🛑 Real-Time Crypto News Service destroyed");
  }

  getSourceStatus(): Record<
    string,
    { connected: boolean; lastUpdate: string; articleCount: number }
  > {
    const stats = this.cryptoRSSService.getFeedStats();
    
    return {
      "crypto-rss": {
        connected: stats.active > 0,
        lastUpdate: stats.lastUpdate.toISOString(),
        articleCount: stats.articleCount,
      },
    };
  }

  getFeedStats() {
    return this.cryptoRSSService.getFeedStats();
  }

  getActiveFeeds() {
    return this.cryptoRSSService.getActiveFeeds();
  }

  getInactiveFeeds() {
    return this.cryptoRSSService.getInactiveFeeds();
  }

  resetErrorCounts() {
    this.cryptoRSSService.resetErrorCounts();
  }
}
