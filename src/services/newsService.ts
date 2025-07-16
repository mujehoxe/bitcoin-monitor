import { NewsArticle } from "@/types/sentiment";
import axios from "axios";

export class NewsService {
  private static instance: NewsService;
  private newsCache: Map<string, NewsArticle[]> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
  private lastFetchTime = 0;
  private minFetchInterval = 5 * 60 * 1000; // Minimum 5 minutes between fetches

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async fetchBitcoinNews(limit: number = 20): Promise<NewsArticle[]> {
    try {
      const cacheKey = `bitcoin-news-${limit}`;
      const cached = this.newsCache.get(cacheKey);

      // Check cache first
      if (
        cached &&
        Date.now() - parseInt(cached[0]?.id || "0") < this.cacheTimeout
      ) {
        return cached;
      }

      // Rate limiting: prevent too frequent API calls
      const now = Date.now();
      if (now - this.lastFetchTime < this.minFetchInterval) {
        console.log("Rate limiting: Using cached data or fallback");
        return cached || (await this.getFallbackNews());
      }

      this.lastFetchTime = now;

      // Check if we have API keys configured
      const hasNewsApiKey =
        process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== "";
      const hasApiKeys = hasNewsApiKey;

      let news: NewsArticle[] = [];

      if (hasApiKeys) {
        // Only try external APIs if we have valid API keys
        const newsPromises = [];

        if (hasNewsApiKey) {
          newsPromises.push(this.fetchFromNewsAPI(limit));
        }

        // CryptoPanic is disabled for now to avoid rate limiting
        // newsPromises.push(this.fetchFromCryptoPanic(limit));

        const newsResults = await Promise.allSettled(newsPromises);

        // Combine successful results
        news = newsResults
          .filter((result) => result.status === "fulfilled")
          .flatMap(
            (result) => (result as PromiseFulfilledResult<NewsArticle[]>).value
          );
      }

      // If no external news or API calls failed, use fallback data
      if (news.length === 0) {
        console.log(
          "Using fallback news data (no API keys configured or API calls failed)"
        );
        news = await this.getFallbackNews();
      }

      // Deduplicate and sort
      const uniqueNews = this.deduplicateNews(news);
      const sortedNews = uniqueNews
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, limit);

      this.newsCache.set(cacheKey, sortedNews);
      return sortedNews;
    } catch (error) {
      console.error("Error fetching Bitcoin news:", error);
      // Return fallback data on any error
      return this.getFallbackNews();
    }
  }

  private async fetchFromNewsAPI(limit: number): Promise<NewsArticle[]> {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) {
        console.log("NewsAPI: No API key configured, skipping");
        return [];
      }

      const response = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: "bitcoin OR cryptocurrency OR BTC",
          language: "en",
          sortBy: "publishedAt",
          pageSize: limit,
          apiKey: apiKey,
        },
        timeout: 10000,
      });

      return (
        response.data.articles?.map(
          (article: {
            title: string;
            description: string;
            content: string;
            publishedAt: string;
            source: { name: string };
            url: string;
            author?: string;
            urlToImage?: string;
          }) => ({
            id: `newsapi-${Date.now()}-${Math.random()}`,
            title: article.title || "",
            description: article.description || "",
            content: article.content || article.description || "",
            publishedAt: article.publishedAt || new Date().toISOString(),
            source: article.source?.name || "NewsAPI",
            url: article.url || "",
            author: article.author,
            urlToImage: article.urlToImage,
          })
        ) || []
      );
    } catch (error) {
      console.warn("NewsAPI fetch failed:", error);
      return [];
    }
  }

  private async fetchFromCryptoPanic(): Promise<NewsArticle[]> {
    try {
      // CryptoPanic API is currently disabled to avoid rate limiting issues
      // Enable this when you have proper API credentials
      return [];

      /* Uncomment when you have API credentials:
      const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
        params: {
          auth_token: process.env.CRYPTOPANIC_API_KEY,
          currencies: 'BTC',
          filter: 'hot',
          public: 'true'
        },
        timeout: 10000
      });

      return response.data.results?.map((post: {
        id: string;
        title: string;
        published_at: string;
        url: string;
        source: { title: string };
      }) => ({
        id: `cryptopanic-${post.id}`,
        title: post.title || '',
        description: post.title || '',
        content: post.title || '',
        publishedAt: post.published_at || new Date().toISOString(),
        source: post.source?.title || 'CryptoPanic',
        url: post.url || '',
        author: post.source?.title
      })) || [];
      */
    } catch (error) {
      console.warn("CryptoPanic fetch failed:", error);
      return [];
    }
  }

  private async fetchFromCoinTelegraph(): Promise<NewsArticle[]> {
    try {
      // CoinTelegraph RSS feed is currently disabled to avoid CORS issues
      // Enable this with a proper RSS parser or backend proxy
      return [];

      /* Uncomment when you have proper RSS parsing:
      const response = await axios.get('https://cointelegraph.com/rss/tag/bitcoin', {
        timeout: 10000
      });
      
      // This would require XML parsing - for now return empty array
      // In production, you'd parse the RSS feed
      return [];
      */
    } catch (error) {
      console.warn("CoinTelegraph fetch failed:", error);
      return [];
    }
  }

  private deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set();
    return articles.filter((article) => {
      const key = article.title.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Fallback news for demo purposes
  async getFallbackNews(): Promise<NewsArticle[]> {
    return [
      {
        id: "demo-1",
        title:
          "Bitcoin ETF Inflows Hit Record High as Institutional Demand Surges",
        description:
          "Bitcoin exchange-traded funds (ETFs) saw unprecedented inflows this week, with institutional investors driving demand amid growing acceptance of cryptocurrency as a legitimate asset class.",
        content:
          "Bitcoin exchange-traded funds have experienced record-breaking inflows, with over $1.5 billion flowing into Bitcoin ETFs in the past week alone. This surge reflects growing institutional confidence in Bitcoin as a store of value and hedge against traditional market volatility. Major financial institutions continue to add Bitcoin exposure to their portfolios, citing its potential for long-term appreciation and portfolio diversification benefits.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        source: "CryptoFinance Daily",
        url: "https://example.com/bitcoin-etf-inflows",
        author: "Sarah Johnson",
      },
      {
        id: "demo-2",
        title:
          "Federal Reserve Hints at Crypto-Friendly Policy in Latest Statement",
        description:
          "The Federal Reserve's latest policy statement suggests a more accommodating stance toward cryptocurrency regulation, potentially boosting market confidence.",
        content:
          "In a significant development for the cryptocurrency market, the Federal Reserve has indicated a shift toward more crypto-friendly policies in its latest monetary policy statement. The Fed acknowledged the growing role of digital assets in the financial system and suggested that overly restrictive regulations could stifle innovation. This signals potential regulatory clarity that could benefit Bitcoin and other cryptocurrencies in the medium term.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
        source: "Financial Times Crypto",
        url: "https://example.com/fed-crypto-policy",
        author: "Michael Chen",
      },
      {
        id: "demo-3",
        title: "Major Mining Pool Announces Carbon-Neutral Operations",
        description:
          "One of the world's largest Bitcoin mining pools has announced plans to achieve carbon neutrality by 2024, addressing environmental concerns.",
        content:
          "A leading Bitcoin mining pool has announced ambitious plans to become carbon neutral by 2024, partnering with renewable energy providers and implementing advanced energy efficiency measures. This initiative addresses one of the primary criticisms of Bitcoin mining and demonstrates the industry's commitment to environmental sustainability. The move could positively impact Bitcoin's long-term adoption and regulatory acceptance.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1.25 hours ago
        source: "Green Mining News",
        url: "https://example.com/carbon-neutral-mining",
        author: "Emily Rodriguez",
      },
      {
        id: "demo-4",
        title: "Bitcoin Network Hashrate Reaches New All-Time High",
        description:
          "The Bitcoin network's computational power has reached unprecedented levels, indicating strong miner confidence and network security.",
        content:
          "Bitcoin's network hashrate has achieved a new all-time high, surpassing 500 exahashes per second. This milestone demonstrates the robust security of the Bitcoin network and reflects strong miner confidence in Bitcoin's future prospects. The increased hashrate makes the network more secure against potential attacks and indicates healthy competition among miners worldwide.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        source: "Blockchain Analytics",
        url: "https://example.com/hashrate-ath",
        author: "David Kim",
      },
      {
        id: "demo-5",
        title:
          "Central Bank Digital Currency Development Could Boost Bitcoin Adoption",
        description:
          "Experts suggest that CBDC development by major central banks may inadvertently increase Bitcoin adoption as a decentralized alternative.",
        content:
          "As central banks worldwide accelerate their development of Central Bank Digital Currencies (CBDCs), cryptocurrency experts argue this could paradoxically boost Bitcoin adoption. CBDCs may introduce more people to digital currencies while highlighting Bitcoin's unique properties as a decentralized, censorship-resistant alternative to government-controlled digital money. This dynamic could create new demand for Bitcoin among users seeking financial sovereignty.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        source: "Digital Currency Report",
        url: "https://example.com/cbdc-bitcoin-adoption",
        author: "Lisa Wang",
      },
      {
        id: "demo-6",
        title: "Technical Analysis: Bitcoin Shows Strong Support at Key Level",
        description:
          "Technical indicators suggest Bitcoin is forming a strong support level, with analysts predicting potential upward movement.",
        content:
          "Bitcoin has shown resilient support at the $42,000 level, with technical analysts noting strong buying pressure and reduced selling volume. Key technical indicators including the Relative Strength Index (RSI) and Moving Average Convergence Divergence (MACD) suggest potential for upward price movement. Volume analysis indicates accumulation by long-term holders, which typically precedes significant price rallies.",
        publishedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(), // 2.5 hours ago
        source: "Technical Analysis Pro",
        url: "https://example.com/bitcoin-technical-analysis",
        author: "Robert Thompson",
      },
    ];
  }
}
