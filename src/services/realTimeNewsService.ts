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
interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  source: { name: string };
  url: string;
  author: string;
  urlToImage?: string;
}

interface NewsAPIResponse {
  articles: NewsAPIArticle[];
}

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

interface GNewsPythonResponse {
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
  private rateLimits: Map<string, { requests: number; resetTime: number }> =
    new Map();

  private constructor() {
    this.rssService = RSSParserService.getInstance();
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
        {
          id: "newsapi",
          name: "NewsAPI",
          url: "https://newsapi.org/v2/everything",
          category: "general",
          hasWebSocket: false,
          apiKey: isDemoMode ? undefined : process.env.NEXT_PUBLIC_NEWS_API_KEY,
        },
        {
          id: "cryptopanic",
          name: "CryptoPanic",
          url: "https://cryptopanic.com/api/v1/posts/",
          category: "crypto",
          hasWebSocket: false,
          apiKey: isDemoMode ? undefined : process.env.CRYPTOPANIC_API_KEY,
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
    console.log("🚀 Initializing enhanced real-time news feeds...");

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (isDemoMode) {
      console.log("🎭 Demo mode enabled - using demo data");
      for (const source of this.config.sources) {
        const demoData = await this.getDemoDataForSource(source.id);
        this.newsCache.set(source.id, demoData);
      }
      return;
    }

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
        this.newsCache.set(source.id, articles);
        this.lastFetchTimes.set(source.id, Date.now());

        console.log(
          `✅ Fetched ${articles.length} articles from ${source.name}`
        );
      } catch (error) {
        console.error(`❌ Error polling ${source.name}:`, error);
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
      newsapi: 120000, // 2 minutes - reduces API calls
      cryptopanic: 60000, // 1 minute - crypto news
      cointelegraph: 300000, // 5 minutes - RSS feeds
      coindesk_rss: 300000, // 5 minutes - RSS feeds
    };
    return intervals[sourceId] || 120000;
  }

  private async fetchFromSource(source: NewsSource): Promise<NewsArticle[]> {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (isDemoMode) {
      return await this.getDemoDataForSource(source.id);
    }

    try {
      switch (source.id) {
        case "gnews":
          return await this.fetchFromGNews();
        case "newsapi":
          return await this.fetchFromNewsAPI(source);
        case "cryptopanic":
          return await this.fetchFromCryptoPanic(source);
        case "cointelegraph":
          return await this.rssService.fetchCryptoNews();
        case "coindesk_rss":
          return await this.rssService.fetchCryptoNews();
        default:
          return await this.getDemoDataForSource(source.id);
      }
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      return await this.getDemoDataForSource(source.id);
    }
  }

  private async fetchFromNewsAPI(source: NewsSource): Promise<NewsArticle[]> {
    if (!source.apiKey) return [];

    try {
      // Single optimized query to reduce API calls
      const query = "bitcoin OR cryptocurrency OR BTC";
      const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `${source.url}?q=${encodeURIComponent(
          query
        )}&from=${fromDate}&sortBy=publishedAt&apiKey=${
          source.apiKey
        }&pageSize=50&language=en`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("NewsAPI rate limit reached, using demo fallback");
          return await this.getDemoDataForSource("newsapi");
        }
        throw new Error(`NewsAPI request failed: ${response.statusText}`);
      }

      const data: NewsAPIResponse = await response.json();

      const articles =
        data.articles?.map((article: NewsAPIArticle) => ({
          id: `newsapi-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          title: article.title || "No title",
          description: article.description || "No description",
          content: article.content || article.description || "No content",
          publishedAt: article.publishedAt || new Date().toISOString(),
          source: article.source?.name || "NewsAPI",
          url: article.url || "",
          author: article.author || "Unknown",
          urlToImage: article.urlToImage,
        })) || [];

      // Filter for 24 hours and remove duplicates
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      const filteredArticles = articles.filter(
        (article) => new Date(article.publishedAt).getTime() >= cutoffTime
      );

      // Remove duplicates based on title
      const uniqueArticles = filteredArticles.filter(
        (article, index, self) =>
          index === self.findIndex((a) => a.title === article.title)
      );

      return uniqueArticles.slice(0, 20);
    } catch (error) {
      console.error("Error fetching from NewsAPI:", error);
      return await this.getDemoDataForSource("newsapi");
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
        console.warn("GNews Python service error, using fallback");
        return await this.getDemoDataForSource("gnews");
      }

      const data: GNewsPythonResponse = await response.json();

      const articles =
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
        (article) => new Date(article.publishedAt).getTime() >= cutoffTime
      );

      // Remove duplicates based on title
      const uniqueArticles = filteredArticles.filter(
        (article: NewsArticle, index: number, self: NewsArticle[]) =>
          index ===
          self.findIndex((a: NewsArticle) => a.title === article.title)
      );

      return uniqueArticles.slice(0, 20);
    } catch (error) {
      console.error("Error fetching from GNews Python service:", error);
      return await this.getDemoDataForSource("gnews");
    }
  }

  private async fetchFromCryptoPanic(
    source: NewsSource
  ): Promise<NewsArticle[]> {
    if (!source.apiKey) {
      console.warn("CryptoPanic API key not available - using RSS fallback");
      return await this.rssService.fetchCryptoNews();
    }

    try {
      const response = await fetch(
        `${source.url}?auth_token=${source.apiKey}&public=true&currencies=BTC&filter=hot&kind=news&limit=20`
      );

      if (!response.ok) {
        console.warn("CryptoPanic API error, using RSS fallback");
        return await this.rssService.fetchCryptoNews();
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
      return await this.rssService.fetchCryptoNews();
    }
  }

  private addNewsToCache(sourceId: string, article: NewsArticle): void {
    const cached = this.newsCache.get(sourceId) || [];
    cached.unshift(article);

    if (cached.length > this.config.maxArticles) {
      cached.splice(this.config.maxArticles);
    }

    this.newsCache.set(sourceId, cached);
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

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (isDemoMode) {
      for (const source of this.config.sources) {
        const demoData = await this.getDemoDataForSource(source.id);
        this.newsCache.set(source.id, demoData);
      }
      return;
    }

    const promises = this.config.sources
      .filter((source) => !source.hasWebSocket)
      .map(async (source) => {
        try {
          const articles = await this.fetchFromSource(source);
          this.newsCache.set(source.id, articles);
          console.log(
            `✅ Refreshed ${articles.length} articles from ${source.name}`
          );
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

    // WebSocket cleanup removed - no longer needed
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
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    for (const source of this.config.sources) {
      const articles = this.newsCache.get(source.id) || [];
      const lastUpdate =
        articles.length > 0 ? articles[0].publishedAt : "Never";

      const connected = isDemoMode
        ? articles.length > 0
        : this.refreshTimers.has(source.id);

      status[source.id] = {
        connected,
        lastUpdate,
        articleCount: articles.length,
      };
    }

    return status;
  }

  private async getDemoDataForSource(sourceId: string): Promise<NewsArticle[]> {
    const now = Date.now();

    const baseArticles = {
      gnews: [
        {
          title:
            "Bitcoin Reaches New All-Time High Amid Institutional Adoption",
          description:
            "Bitcoin surges past $70,000 as major corporations announce Bitcoin treasury additions.",
          content:
            "The cryptocurrency market sees unprecedented institutional interest with multiple Fortune 500 companies adding Bitcoin to their balance sheets.",
        },
        {
          title: "Global Bank Launches Bitcoin Custody Services",
          description:
            "Leading international bank introduces comprehensive Bitcoin custody solutions for institutional clients.",
          content:
            "The new service provides secure storage and management of Bitcoin assets for large institutional investors.",
        },
      ],
      newsapi: [
        {
          title: "Bitcoin Adoption Accelerates Among Fortune 500 Companies",
          description:
            "A growing number of major corporations are adding Bitcoin to their treasury reserves.",
          content:
            "The trend of corporate Bitcoin adoption continues to gain momentum.",
        },
        {
          title: "Global Payment Giant Integrates Bitcoin Support",
          description:
            "Major payment processor announces Bitcoin integration across its worldwide network.",
          content:
            "The integration represents a significant step toward mainstream Bitcoin adoption.",
        },
      ],
      cryptopanic: [
        {
          title: "Bitcoin Price Shows Strong Recovery After Market Volatility",
          description:
            "Bitcoin has shown resilience with a 5% gain in the past 24 hours.",
          content:
            "Bitcoin continues to demonstrate its strength as a store of value.",
        },
        {
          title: "Major Exchange Announces New Bitcoin Trading Features",
          description:
            "Leading cryptocurrency exchange introduces advanced trading tools.",
          content:
            "The new features include enhanced charting tools and improved order execution.",
        },
      ],
      cointelegraph: [
        {
          title: "Bitcoin Technical Analysis: Key Resistance Levels to Watch",
          description:
            "Technical indicators suggest potential breakout above $45,000.",
          content:
            "Multiple technical indicators are aligning for a potential upward movement.",
        },
        {
          title: "Ethereum 2.0 Staking Reaches New Milestone",
          description:
            "Over 30 million ETH now staked in Ethereum 2.0 deposit contract.",
          content:
            "The milestone demonstrates growing confidence in Ethereum's future.",
        },
      ],
      coindesk_rss: [
        {
          title: "Bitcoin Network Hashrate Reaches New All-Time High",
          description:
            "Bitcoin mining network shows unprecedented security strength.",
          content:
            "The increased hashrate demonstrates growing confidence in Bitcoin's long-term value.",
        },
        {
          title: "Institutional Adoption of Bitcoin Continues to Grow",
          description:
            "Major financial institutions announce new Bitcoin-related services.",
          content:
            "The trend shows increasing mainstream acceptance of Bitcoin.",
        },
      ],
    };

    const articles =
      baseArticles[sourceId as keyof typeof baseArticles] ||
      baseArticles.newsapi;

    return articles.map((article, index) => ({
      id: `${sourceId}-demo-${index}-${Date.now()}`,
      ...article,
      publishedAt: new Date(now - (index + 1) * 3600000).toISOString(),
      source: `${sourceId.charAt(0).toUpperCase() + sourceId.slice(1)} (Demo)`,
      url: `https://example.com/${sourceId}`,
      author: sourceId,
    }));
  }
}
