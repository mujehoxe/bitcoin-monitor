import { NextRequest } from "next/server";
import { CryptoRSSService } from "@/services/cryptoRSSService";
import { SocialAPIService } from "@/services/socialAPIService";
import { NewsArticle } from "@/types/sentiment";
import fs from 'fs';
import path from 'path';

let feedsCache: string[] | null = null;

// Read feeds from CSV file (server-side only) - cached
function loadFeedsFromCSV(): string[] {
  if (feedsCache) {
    return feedsCache;
  }

  try {
    const csvPath = path.join(process.cwd(), 'crypto_feeds.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
    
    feedsCache = lines;
    console.log(`📰 Loaded ${lines.length} crypto RSS feeds from CSV (cached)`);
    return lines;
  } catch (error) {
    console.error('Error loading crypto feeds CSV:', error);
    return [];
  }
}

// Initialize RSS service once
let rssServiceInitialized = false;
let socialServiceInitialized = false;

async function initializeRSSService(): Promise<CryptoRSSService> {
  const rssService = CryptoRSSService.getInstance();
  
  if (!rssServiceInitialized) {
    const feedUrls = loadFeedsFromCSV();
    if (feedUrls.length > 0) {
      rssService.initializeFeeds(feedUrls);
      rssServiceInitialized = true;
    }
  }
  
  return rssService;
}

async function initializeSocialService(): Promise<SocialAPIService> {
  const socialService = SocialAPIService.getInstance();
  
  if (!socialServiceInitialized) {
    // Social service initializes its own feeds
    socialServiceInitialized = true;
  }
  
  return socialService;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const refresh = searchParams.get("refresh") === "true";
  const includeSocial = searchParams.get("social") !== "false"; // Include social by default

  try {
    // Initialize both services
    const rssService = await initializeRSSService();
    const socialService = await initializeSocialService();
    
    const allArticles: NewsArticle[] = [];
    
    // Fetch RSS feeds
    if (refresh) {
      await rssService.refreshFeeds();
    }
    
    let rssArticles;
    if (query) {
      rssArticles = await rssService.searchArticles(query);
    } else {
      rssArticles = rssService.getArticles();
    }
    
    allArticles.push(...rssArticles);
    
    // Fetch social feeds (Binance Square/News) if enabled
    if (includeSocial) {
      try {
        console.log('🔄 Fetching social feeds via server-side...');
        const socialArticles = await socialService.fetchAllFeeds();
        allArticles.push(...socialArticles);
        console.log(`✅ Added ${socialArticles.length} social articles`);
      } catch (error) {
        console.warn('⚠️ Social feeds failed, continuing with RSS only:', error);
      }
    }

    // Sort all articles by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const rssStats = rssService.getFeedStats();

    return Response.json({
      articles: allArticles,
      totalArticles: allArticles.length,
      rssArticles: rssArticles.length,
      socialArticles: allArticles.length - rssArticles.length,
      stats: rssStats,
      source: "crypto-rss-and-social-feeds"
    });
  } catch (error) {
    console.error("Error in crypto RSS API:", error);
    return Response.json(
      { 
        error: "Failed to fetch crypto feeds", 
        articles: [], 
        totalArticles: 0,
        stats: null
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query } = body;

    const rssService = await initializeRSSService();
    const socialService = await initializeSocialService();

    switch (action) {
      case "refresh":
        await rssService.refreshFeeds();
        await socialService.refreshFeeds();
        return Response.json({ message: "RSS and social feeds refreshed successfully" });
      
      case "refresh-rss":
        await rssService.refreshFeeds();
        return Response.json({ message: "RSS feeds refreshed successfully" });
      
      case "refresh-social":
        await socialService.refreshFeeds();
        return Response.json({ message: "Social feeds refreshed successfully" });
      
      case "search":
        const rssArticles = await rssService.searchArticles(query || "");
        const socialArticles = socialService.getArticles();
        
        // Combine and filter social articles by query if provided
        const allArticles = [...rssArticles];
        if (query) {
          const filteredSocialArticles = socialArticles.filter(article => 
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.description.toLowerCase().includes(query.toLowerCase()) ||
            article.content.toLowerCase().includes(query.toLowerCase())
          );
          allArticles.push(...filteredSocialArticles);
        } else {
          allArticles.push(...socialArticles);
        }
        
        // Sort by publication date
        allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        return Response.json({ articles: allArticles, totalArticles: allArticles.length });
      
      case "stats":
        const stats = rssService.getFeedStats();
        return Response.json({ stats });
      
      case "reset":
        rssService.resetErrorCounts();
        return Response.json({ message: "RSS error counts reset successfully" });
      
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in crypto RSS POST:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
