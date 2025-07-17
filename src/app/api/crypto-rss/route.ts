import { NextRequest } from "next/server";
import { CryptoRSSService } from "@/services/cryptoRSSService";
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const refresh = searchParams.get("refresh") === "true";

  try {
    const rssService = await initializeRSSService();
    
    if (refresh) {
      await rssService.refreshFeeds();
    }
    
    let articles;
    if (query) {
      articles = await rssService.searchArticles(query);
    } else {
      articles = rssService.getArticles();
    }

    const stats = rssService.getFeedStats();

    return Response.json({
      articles,
      totalArticles: articles.length,
      stats,
      source: "crypto-rss-feeds"
    });
  } catch (error) {
    console.error("Error in crypto RSS API:", error);
    return Response.json(
      { 
        error: "Failed to fetch crypto RSS feeds", 
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

    switch (action) {
      case "refresh":
        await rssService.refreshFeeds();
        return Response.json({ message: "Feeds refreshed successfully" });
      
      case "search":
        const articles = await rssService.searchArticles(query || "");
        return Response.json({ articles, totalArticles: articles.length });
      
      case "stats":
        const stats = rssService.getFeedStats();
        return Response.json({ stats });
      
      case "reset":
        rssService.resetErrorCounts();
        return Response.json({ message: "Error counts reset successfully" });
      
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

// Function to reset cache (for development/testing)
export function resetFeedsCache(): void {
  feedsCache = null;
  rssServiceInitialized = false;
}
