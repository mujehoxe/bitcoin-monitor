import { NewsArticle } from "@/types/sentiment";
import { RSSParserService } from "./rssParser";

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

// API Response interfaces
interface CryptoPanicPost {
  id: string;
  title: string;
  published_at: string;
  url: string;
  source: { title: string };
}

interface CryptoPanicResponse {
  results: CryptoPanicPost[];
}

interface GNewsPythonArticle {
  title: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  source?: string;
  url: string;
  author?: string;
  urlToImage?: string;
}

interface GNewsResponse {
  articles: GNewsPythonArticle[];
}

export class RealTimeNewsService {
  private static instance: RealTimeNewsService;
  private config: RealTimeNewsConfig;
  private newsCache: Map<string, NewsArticle[]> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private rssService: RSSParserService;
  private lastFetchTimes: Map<string, number> = new Map();

  private constructor() {
    this.rssService = RSSParserService.getInstance();

    // Always use real APIs, never demo mode
    this.config = {
      refreshInterval: parseInt(
        process.env.NEXT_PUBLIC_NEWS_REFRESH_INTERVAL || "30000"
      ),
      maxArticles: 100,
      sources: [
        {
          id: "gnews",
          name: "GNews Python",
          url: "/api/gnews",
          category: "general",
          hasWebSocket: false,
        },
        // CryptoPanic temporarily disabled due to quota exceeded
        // {
        //   id: "cryptopanic",
        //   name: "CryptoPanic",
        //   url: "https://cryptopanic.com/api/developer/v2/posts/",
        //   category: "crypto",
        //   hasWebSocket: false,
        //   apiKey: process.env.NEXT_PUBLIC_CRYPTOPANIC_API_KEY || process.env.CRYPTOPANIC_API_KEY,
        // },
        {
          id: "cryptopanic_rss",
          name: "CryptoPanic RSS",
          url: "https://cryptopanic.com/news/rss/",
          category: "crypto",
          hasWebSocket: false,
        },
        {
          id: "cointelegraph",
          name: "CoinTelegraph",
          url: "https://cointelegraph.com/rss",
          category: "crypto",
          hasWebSocket: false,
        },
        {
          id: "coindesk_rss",
          name: "CoinDesk RSS",
          url: "https://coindesk.com/arc/outboundfeeds/rss/",
          category: "crypto",
          hasWebSocket: false,
        },
        {
          id: "bitcoin_magazine",
          name: "Bitcoin Magazine",
          url: "https://bitcoinmagazine.com/.rss/full/",
          category: "crypto",
          hasWebSocket: false,
        },
        {
          id: "decrypt",
          name: "Decrypt",
          url: "https://decrypt.co/feed",
          category: "crypto",
          hasWebSocket: false,
        },
      ],
      categories: ["crypto", "general"],
    };
  }

  static getInstance(): RealTimeNewsService {
    if (!RealTimeNewsService.instance) {
      RealTimeNewsService.instance = new RealTimeNewsService();
    }
    return RealTimeNewsService.instance;
  }

  async initializeRealTimeFeeds(): Promise<void> {
    console.log("🚀 Initializing real-time news feeds...");

    // Start polling for all sources (no WebSocket support for pure news)
    for (const source of this.config.sources) {
      this.startPolling(source);
    }
  }

  private startPolling(source: NewsSource): void {
    const poll = async () => {
      try {
        if (this.shouldSkipFetch(source.id)) {
          console.log(`⏭️ Skipping ${source.name} due to rate limit`);
          return;
        }

        const articles = await this.fetchFromSource(source);
        if (articles.length > 0) {
          this.newsCache.set(source.id, articles);
          this.lastFetchTimes.set(source.id, Date.now());
          console.log(
            `✅ Fetched ${articles.length} articles from ${source.name}`
          );
        }
      } catch (error) {
        console.error(`❌ Error polling ${source.name}:`, error);
        console.log(`⏭️ Skipping ${source.name} due to error`);
      }
    };

    poll();
    const timer = setInterval(poll, this.config.refreshInterval);
    this.refreshTimers.set(source.id, timer);
  }

  private shouldSkipFetch(sourceId: string): boolean {
    const lastFetch = this.lastFetchTimes.get(sourceId) || 0;
    const minInterval = this.getMinIntervalForSource(sourceId);
    return Date.now() - lastFetch < minInterval;
  }

  private getMinIntervalForSource(sourceId: string): number {
    const intervals: Record<string, number> = {
      gnews: 60000, // 1 minute - GNews Python service
      cryptopanic: 60000, // 1 minute - crypto news
      cointelegraph: 300000, // 5 minutes - RSS feeds
      coindesk_rss: 300000, // 5 minutes - RSS feeds
    };
    return intervals[sourceId] || 120000;
  }

  private async fetchFromSource(source: NewsSource): Promise<NewsArticle[]> {
    try {
      switch (source.id) {
        case "gnews":
          return await this.fetchFromGNews();
        case "cryptopanic":
          return await this.fetchFromCryptoPanic(source);
        case "cointelegraph":
          return await this.rssService.fetchCryptoNews();
        case "coindesk_rss":
          return await this.rssService.fetchCryptoNews();
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      return []; // Return empty array instead of demo data
    }
  }

  private async fetchFromGNews(): Promise<NewsArticle[]> {
    try {
      const response = await fetch("/api/gnews?type=bitcoin", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("GNews Python service error - skipping source");
        return [];
      }

      const data: GNewsResponse = await response.json();

      const articles: NewsArticle[] =
        data.articles?.map((article: GNewsPythonArticle) => ({
          id: `gnews-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: article.title || "No title",
          description: article.description || "No description",
          content: article.content || article.description || "No content",
          publishedAt: article.publishedAt || new Date().toISOString(),
          source: article.source || "GNews Python",
          url: article.url || "",
          author: article.author || "Unknown",
          urlToImage: article.urlToImage,
        })) || [];

      // Filter for 24 hours and remove duplicates
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      const filteredArticles = articles.filter(
        (article: NewsArticle) => new Date(article.publishedAt).getTime() >= cutoffTime
      );

      // Remove duplicates based on title
      const uniqueArticles = filteredArticles.filter(
        (article: NewsArticle, index: number, self: NewsArticle[]) =>
          index === self.findIndex((a: NewsArticle) => a.title === article.title)
      );

      return uniqueArticles.slice(0, 20);
    } catch (error) {
      console.error("Error fetching from GNews Python service:", error);
      return []; // Return empty array instead of demo data
    }
  }

  private async fetchFromCryptoPanic(
    source: NewsSource
  ): Promise<NewsArticle[]> {
    if (!source.apiKey) {
      console.warn(
        `CryptoPanic API key not available - skipping ${source.name}`
      );
      return [];
    }

    try {
      const response = await fetch(
        `${source.url}?auth_token=${source.apiKey}&public=true&currencies=BTC&filter=hot&kind=news&limit=20`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.status === "api_error" && errorData?.info?.includes("quota exceeded")) {
          console.warn(`CryptoPanic API quota exceeded - skipping ${source.name}`);
          return [];
        }
        console.warn(`CryptoPanic API error (${response.status}) - skipping ${source.name}`);
        return [];
      }

      const data: CryptoPanicResponse = await response.json();

      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;

      return (
        data.results
          ?.map((post: CryptoPanicPost) => ({
            id: `cryptopanic-${post.id}`,
            title: post.title || "No title",
            description: post.title || "No description",
            content: post.title || "No content",
            publishedAt: post.published_at || new Date().toISOString(),
            source: post.source?.title || "CryptoPanic",
            url: post.url || "",
            author: post.source?.title || "Unknown",
          }))
          .filter(
            (post) => new Date(post.publishedAt).getTime() >= cutoffTime
          ) || []
      );
    } catch (error) {
      console.error("Error fetching from CryptoPanic:", error);
      return []; // Return empty array instead of demo data
    }
  }

  async getAllNews(): Promise<NewsArticle[]> {
    const allNews: NewsArticle[] = [];

    for (const articles of this.newsCache.values()) {
      allNews.push(...articles);
    }

    // Remove duplicates and sort
    const uniqueNews = allNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.title === article.title)
    );

    uniqueNews.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return uniqueNews.slice(0, this.config.maxArticles);
  }

  async getNewsByCategory(category: string): Promise<NewsArticle[]> {
    const categoryNews: NewsArticle[] = [];

    for (const source of this.config.sources) {
      if (source.category === category || category === "all") {
        const articles = this.newsCache.get(source.id) || [];
        categoryNews.push(...articles);
      }
    }

    // Remove duplicates and sort
    const uniqueNews = categoryNews.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.title === article.title)
    );

    uniqueNews.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return uniqueNews.slice(0, this.config.maxArticles);
  }

  async refreshAllSources(): Promise<void> {
    console.log("🔄 Refreshing all news sources...");

    const promises = this.config.sources
      .filter((source) => !source.hasWebSocket)
      .map(async (source) => {
        try {
          const articles = await this.fetchFromSource(source);
          if (articles.length > 0) {
            this.newsCache.set(source.id, articles);
            console.log(
              `✅ Refreshed ${articles.length} articles from ${source.name}`
            );
          }
        } catch (error) {
          console.error(`❌ Error refreshing ${source.name}:`, error);
        }
      });

    await Promise.allSettled(promises);
  }

  destroy(): void {
    for (const timer of this.refreshTimers.values()) {
      clearInterval(timer);
    }
    this.refreshTimers.clear();

    this.websockets.clear();
    this.newsCache.clear();
  }

  getSourceStatus(): Record<
    string,
    { connected: boolean; lastUpdate: string; articleCount: number }
  > {
    const status: Record<
      string,
      { connected: boolean; lastUpdate: string; articleCount: number }
    > = {};

    for (const source of this.config.sources) {
      const articles = this.newsCache.get(source.id) || [];
      const lastUpdate =
        articles.length > 0 ? articles[0].publishedAt : "Never";

      const connected = this.refreshTimers.has(source.id);

      status[source.id] = {
        connected,
        lastUpdate,
        articleCount: articles.length,
      };
    }

    return status;
  }
}
