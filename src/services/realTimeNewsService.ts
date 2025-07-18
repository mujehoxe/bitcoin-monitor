import { NewsArticle } from "@/types/sentiment";

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
  private lastFetchTimes: Map<string, number> = new Map();

  private constructor() {
    // Simplified configuration - unified crypto feeds (RSS + Social)
    this.config = {
      refreshInterval: parseInt(
        process.env.NEXT_PUBLIC_NEWS_REFRESH_INTERVAL || "300000" // 5 minutes
      ),
      maxArticles: 200,
      sources: [
        {
          id: "crypto-unified",
          name: "Crypto Unified Feeds",
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
        console.log("🔄 Auto-refreshing unified crypto feeds...");
        
        // Refresh unified crypto feeds (RSS + Social)
        const response = await fetch('/api/crypto-rss?refresh=true');

        let totalArticles = 0;
        
        if (response.ok) {
          const data = await response.json();
          totalArticles = data.totalArticles || 0;
          console.log(`✅ Refreshed ${totalArticles} articles (${data.rssArticles || 0} RSS + ${data.socialArticles || 0} social)`);
        } else {
          console.warn('⚠️ Failed to refresh unified crypto feeds');
        }
      } catch (error) {
        console.error("❌ Error during auto-refresh:", error);
      }
    }, this.config.refreshInterval);

    this.refreshTimers.set("unified-feeds", timer);
  }

  async getAllNews(): Promise<NewsArticle[]> {
    try {
      // Fetch from unified crypto feeds endpoint (RSS + Social)
      const response = await fetch('/api/crypto-rss');

      if (response.ok) {
        const data = await response.json();
        const allArticles = data.articles || [];
        
        console.log(`✅ Fetched ${allArticles.length} articles (${data.rssArticles || 0} RSS + ${data.socialArticles || 0} social)`);
        
        // Articles are already sorted by publication date in the API
        return allArticles;
      } else {
        console.warn('Unified crypto feeds failed:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching news from unified crypto API:', error);
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
    console.log("🔄 Refreshing unified crypto feeds...");
    
    try {
      // Use the unified crypto-rss endpoint instead of separate services
      const response = await fetch('/api/crypto-rss?refresh=true');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Refreshed ${data.totalArticles || 0} articles (${data.rssArticles || 0} RSS + ${data.socialArticles || 0} social)`);
      } else {
        console.warn('⚠️ Failed to refresh unified crypto feeds:', response.status);
        throw new Error(`Failed to refresh unified crypto feeds: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error refreshing unified crypto feeds:', error);
      throw error; // Re-throw to handle in the calling code
    }
  }

  async searchNews(query: string): Promise<NewsArticle[]> {
    // Use the unified API endpoint with search
    try {
      const response = await fetch(`/api/crypto-rss?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data.articles || [];
      } else {
        console.warn('Search failed:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
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
    // Return simplified status since we're using unified API
    return {
      "crypto-unified": {
        connected: true, // Assume connected if service is running
        lastUpdate: new Date().toISOString(),
        articleCount: 0, // Could be updated if needed
      },
    };
  }

  getFeedStats() {
    // Return simplified stats for unified API
    return {
      active: 1,
      inactive: 0,
      total: 1,
      lastUpdate: new Date(),
      articleCount: 0,
    };
  }

  getActiveFeeds() {
    // Return simplified active feeds info
    return [{ name: "Crypto Unified Feeds", url: "/api/crypto-rss", isActive: true }];
  }

  getInactiveFeeds() {
    // Return empty array since unified API handles all feeds
    return [];
  }

  resetErrorCounts() {
    // No-op since unified API handles error management
    console.log("✅ Error counts reset (unified API)");
  }
}
