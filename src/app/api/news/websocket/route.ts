import { RealTimeNewsService } from "@/services/realTimeNewsService";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const clients: Set<ReadableStreamDefaultController> = new Set();

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      console.log(`📡 Client connected. Total clients: ${clients.size}`);

      // Send initial connection message
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "connected",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      // Send initial news data
      const sendInitialData = async () => {
        try {
          const newsService = RealTimeNewsService.getInstance();
          const news = await newsService.getAllNews();
          const status = newsService.getSourceStatus();

          controller.enqueue(
            `data: ${JSON.stringify({ type: "initial", news, status })}\n\n`
          );
        } catch (error) {
          console.error("Error sending initial data:", error);
        }
      };

      sendInitialData();

      // Set up periodic updates
      const interval = setInterval(async () => {
        try {
          const newsService = RealTimeNewsService.getInstance();
          const news = await newsService.getAllNews();
          const status = newsService.getSourceStatus();

          controller.enqueue(
            `data: ${JSON.stringify({ type: "update", news, status })}\n\n`
          );
        } catch (error) {
          console.error("Error sending update:", error);
        }
      }, 30000); // Send updates every 30 seconds

      return () => {
        clearInterval(interval);
        clients.delete(controller);
        console.log(`📡 Client disconnected. Total clients: ${clients.size}`);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Function to broadcast updates to all connected clients
function broadcastNewsUpdate(news: unknown, status: unknown) {
  const message = `data: ${JSON.stringify({
    type: "update",
    news,
    status,
  })}\n\n`;
  clients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      console.error("Error broadcasting to client:", error);
      clients.delete(controller);
    }
  });
}

// Handle POST requests for manual updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, category } = body;

    const newsService = RealTimeNewsService.getInstance();

    let news;
    let status;

    switch (action) {
      case "refresh":
        await newsService.refreshAllSources();
        news = await newsService.getAllNews();
        status = newsService.getSourceStatus();
        broadcastNewsUpdate(news, status);
        break;

      case "get_by_category":
        news = await newsService.getNewsByCategory(category || "all");
        status = newsService.getSourceStatus();
        break;

      default:
        news = await newsService.getAllNews();
        status = newsService.getSourceStatus();
    }

    return Response.json({ news, status });
  } catch (error) {
    console.error("Error in POST /api/news/websocket:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
