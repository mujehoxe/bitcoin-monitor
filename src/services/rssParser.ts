import { NewsArticle } from "@/types/sentiment";

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  source?: string;
  guid?: string;
}

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

export class RSSParserService {
  private static instance: RSSParserService;

  static getInstance(): RSSParserService {
    if (!RSSParserService.instance) {
      RSSParserService.instance = new RSSParserService();
    }
    return RSSParserService.instance;
  }

  // Simplified RSS fetching - use demo data as fallback
  async parseRSSFeed(): Promise<RSSFeed> {
    // For now, we'll use demo data to avoid RSS complexity
    throw new Error("RSS fetching disabled - using demo fallback");
  }

  private parseXML(xmlText: string): RSSFeed {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("XML parsing error");
    }

    const channel = xmlDoc.querySelector("channel");
    if (!channel) {
      throw new Error("Invalid RSS format: no channel element");
    }

    const title = channel.querySelector("title")?.textContent || "";
    const description = channel.querySelector("description")?.textContent || "";
    const link = channel.querySelector("link")?.textContent || "";

    const items = Array.from(xmlDoc.querySelectorAll("item")).map((item) => ({
      title: item.querySelector("title")?.textContent || "No title",
      description:
        item.querySelector("description")?.textContent ||
        item.querySelector("content\\:encoded")?.textContent ||
        "",
      link: item.querySelector("link")?.textContent || "",
      pubDate:
        item.querySelector("pubDate")?.textContent || new Date().toISOString(),
      author:
        item.querySelector("author")?.textContent ||
        item.querySelector("dc\\:creator")?.textContent ||
        undefined,
      source: item.querySelector("source")?.textContent || undefined,
      guid: item.querySelector("guid")?.textContent || undefined,
    }));

    return { title, description, link, items };
  }

  async fetchEnvironmentalNews(): Promise<NewsArticle[]> {
    return await this.getDemoDataForSource("guardian_environment");
  }

  async fetchPoliticalNews(): Promise<NewsArticle[]> {
    return await this.getDemoDataForSource("reuters_politics");
  }

  async fetchCryptoNews(): Promise<NewsArticle[]> {
    return await this.getDemoDataForSource("cointelegraph");
  }

  private async getDemoDataForSource(sourceId: string): Promise<NewsArticle[]> {
    const now = Date.now();

    const baseArticles = {
      cointelegraph: [
        {
          title: "Bitcoin Price Surges Past Key Resistance Level",
          description:
            "Technical analysis shows Bitcoin breaking through important resistance with strong volume.",
          content:
            "Bitcoin has shown remarkable strength in recent trading sessions.",
        },
        {
          title: "Major Exchange Lists New Bitcoin Trading Pairs",
          description:
            "Leading cryptocurrency exchange announces support for new Bitcoin trading pairs.",
          content:
            "The expansion provides more trading opportunities for Bitcoin investors.",
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
      reuters_politics: [
        {
          title:
            "Global Economic Summit Discusses Digital Currency Regulations",
          description:
            "World leaders gather to discuss the future of digital currencies.",
          content:
            "The summit covers regulatory frameworks for cryptocurrencies.",
        },
        {
          title: "Federal Reserve Chairman Comments on Digital Assets",
          description:
            "Central bank officials provide insights on digital assets.",
          content:
            "Officials discuss the potential benefits and risks of cryptocurrency adoption.",
        },
      ],
      guardian_environment: [
        {
          title: "UN Report: Climate Change Impact on Global Financial Markets",
          description:
            "New report highlights how climate change affects financial stability.",
          content:
            "The report discusses the intersection of environmental policy and financial technology.",
        },
        {
          title:
            "Green Finance Initiative Includes Cryptocurrency Sustainability",
          description:
            "Global initiative focuses on sustainable finance practices.",
          content:
            "The initiative promotes environmentally responsible financial technologies.",
        },
      ],
    };

    const articles =
      baseArticles[sourceId as keyof typeof baseArticles] ||
      baseArticles.cointelegraph;

    return articles.map((article, index) => ({
      id: `${sourceId}-demo-${index}-${Date.now()}`,
      ...article,
      publishedAt: new Date(now - (index + 1) * 3600000).toISOString(),
      source: sourceId.charAt(0).toUpperCase() + sourceId.slice(1),
      url: `https://example.com/${sourceId}`,
      author: sourceId,
    }));
  }
}
