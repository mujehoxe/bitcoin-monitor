import { NewsArticle } from "@/types/sentiment";
import { CryptoRSSService } from "./cryptoRSSService";

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
  private lastFetchTimes: Map<string, number> = new Map();

  private constructor() {
    this.cryptoRSSService = CryptoRSSService.getInstance();

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
        console.log("🔄 Auto-refreshing crypto RSS feeds...");
        
        // Refresh via API
        const response = await fetch('/api/crypto-rss?refresh=true');
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Refreshed ${data.totalArticles} articles from crypto RSS feeds`);
        } else {
          console.error("❌ Error during auto-refresh:", response.statusText);
        }
      } catch (error) {
        console.error("❌ Error during auto-refresh:", error);
      }
    }, this.config.refreshInterval);

    this.refreshTimers.set("crypto-rss", timer);
  }

  async getAllNews(): Promise<NewsArticle[]> {
    try {
      // Fetch from the API which will handle RSS service initialization
      const response = await fetch('/api/crypto-rss');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Error fetching news from API:', error);
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
    console.log("🔄 Refreshing all crypto RSS feeds...");
    await this.cryptoRSSService.refreshFeeds();
    const articles = this.cryptoRSSService.getArticles();
    this.newsCache.set("crypto-rss", articles);
    console.log(`✅ Refreshed ${articles.length} articles from crypto RSS feeds`);
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
