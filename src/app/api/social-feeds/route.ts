import { NextRequest } from "next/server";
import { SocialAPIService } from "@/services/socialAPIService";

// Initialize social API service once
let socialServiceInitialized = false;
async function initializeSocialService(): Promise<SocialAPIService> {
  const socialService = SocialAPIService.getInstance();
  
  if (!socialServiceInitialized) {
    // Initialize the service (it will set up its own feeds)
    socialServiceInitialized = true;
  }
  
  return socialService;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const refresh = searchParams.get("refresh") === "true";

  try {
    const socialService = await initializeSocialService();
    
    if (refresh) {
      await socialService.refreshFeeds();
    }
    
    let articles;
    if (query) {
      // For now, just return all articles (search functionality can be added later)
      articles = socialService.getArticles().filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      articles = socialService.getArticles();
    }

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
