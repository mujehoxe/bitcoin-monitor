import { NextRequest } from "next/server";
import { SocialAPIService } from "@/services/socialAPIService";

// Initialize social API service once
let socialServiceInitialized = false;
let socialServiceInstance: SocialAPIService | null = null;

async function initializeSocialService(): Promise<SocialAPIService> {
  if (!socialServiceInstance) {
    console.log('🔄 Creating new social API service instance...');
    socialServiceInstance = SocialAPIService.getInstance();
    
    if (!socialServiceInitialized) {
      console.log('🔄 Initializing social API service...');
      await socialServiceInstance.fetchAllFeeds();
      socialServiceInitialized = true;
      console.log('✅ Social API service initialized');
    }
  }
  
  return socialServiceInstance;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const refresh = searchParams.get("refresh") === "true";

  console.log('⚠️ DEPRECATED: /api/social-feeds is deprecated. Use /api/crypto-rss instead which includes both RSS and social feeds.');

  try {
    const socialService = await initializeSocialService();
    
    if (refresh) {
      console.log('🔄 Refreshing social feeds...');
      await socialService.refreshFeeds();
      console.log('✅ Social feeds refreshed');
    }
    
    let articles = socialService.getArticles();
    
    if (query) {
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    console.log(`📊 Returning ${articles.length} social articles`);

    return Response.json({
      articles,
      totalArticles: articles.length,
      source: "social-api-feeds"
    });
  } catch (error) {
    console.error("Error in social API:", error);
    return Response.json(
      { 
        error: "Failed to fetch social API feeds", 
        articles: [], 
        totalArticles: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query } = body;

    const socialService = await initializeSocialService();

    switch (action) {
      case "refresh":
        await socialService.refreshFeeds();
        return Response.json({ message: "Social feeds refreshed successfully" });
      
      case "search":
        const articles = socialService.getArticles().filter(article => 
          article.title.toLowerCase().includes((query || "").toLowerCase()) ||
          article.description.toLowerCase().includes((query || "").toLowerCase())
        );
        return Response.json({ articles, totalArticles: articles.length });
      
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in social API POST:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
