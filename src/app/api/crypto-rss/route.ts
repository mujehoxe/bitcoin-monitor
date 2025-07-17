import { NextRequest } from "next/server";
import { CryptoRSSService } from "@/services/cryptoRSSService";
import fs from 'fs';
import path from 'path';

// Read feeds from CSV file (server-side only)
function loadFeedsFromCSV(): string[] {
  try {
    const csvPath = path.join(process.cwd(), 'crypto_feeds.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
    
    console.log(`📰 Loaded ${lines.length} crypto RSS feeds from CSV`);
    return lines;
  } catch (error) {
    console.error('Error loading crypto feeds CSV:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const refresh = searchParams.get("refresh") === "true";

  try {
    const rssService = CryptoRSSService.getInstance();
    
    // Initialize feeds from CSV if not already done
    const feedUrls = loadFeedsFromCSV();
    if (feedUrls.length > 0) {
      rssService.initializeFeeds(feedUrls);
    }
    
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

    const rssService = CryptoRSSService.getInstance();
    
    // Initialize feeds from CSV if not already done
    const feedUrls = loadFeedsFromCSV();
    if (feedUrls.length > 0) {
      rssService.initializeFeeds(feedUrls);
    }

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
